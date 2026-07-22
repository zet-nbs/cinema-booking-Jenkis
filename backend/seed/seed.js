require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Location = require("../models/Location");
const Bioskop = require("../models/Bioskop");
const Movie = require("../models/Movie");
const Studio = require("../models/Studio");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");

const readSeed = (file) =>
  mongoose.mongo.BSON.EJSON.parse(
    fs.readFileSync(path.join(__dirname, file), "utf8"),
  );

const movieSeeds = readSeed("movies.json");

const addMinutesToTime = (time, minutes) => {
  const [hours, minutesPart] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutesPart + minutes;
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(
    totalMinutes % 60,
  ).padStart(2, "0")}`;
};

const movieDurations = new Map(
  movieSeeds.map((movie) => [String(movie._id), movie.duration]),
);

const studioSeeds = readSeed("studio.json");
const studioCodeCount = studioSeeds.reduce((counts, studio) => {
  counts.set(studio.studioId, (counts.get(studio.studioId) || 0) + 1);
  return counts;
}, new Map());

const normalizedStudios = studioSeeds.map((studio) => {
  if (studioCodeCount.get(studio.studioId) === 1) return studio;

  // `Studio.studioId` unik secara global. Seed lama memakai kode kota yang
  // berulang untuk beberapa bioskop, jadi tambahkan akhiran ObjectId stabil.
  return {
    ...studio,
    studioId: `${studio.studioId}-${String(studio._id).slice(-6)}`,
  };
});

const seeds = {
  locations: readSeed("locations.json"),
  bioskops: readSeed("bioskops.json"),
  movies: movieSeeds,
  studios: normalizedStudios,
  seats: readSeed("seat.json"),
  showtimes: readSeed("showtime.json").map((showtime) => ({
    ...showtime,
    // Model Showtime mewajibkan endTime, sementara seed lama hanya memiliki
    // startTime. Nilainya diturunkan dari durasi film terkait.
    endTime:
      showtime.endTime ||
      addMinutesToTime(
        showtime.startTime,
        movieDurations.get(String(showtime.movieId)),
      ),
  })),
};

const idSet = (items) => new Set(items.map((item) => String(item._id)));

const assertNoDuplicateKeys = (items, getKey, label) => {
  const seen = new Set();
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      throw new Error(`Seed memiliki duplikasi untuk ${label}: ${key}`);
    }
    seen.add(key);
  }
};

const validateRelations = () => {
  const locationIds = idSet(seeds.locations);
  const bioskopIds = idSet(seeds.bioskops);
  const movieIds = idSet(seeds.movies);
  const studioIds = idSet(seeds.studios);
  const studioCinemaById = new Map(
    seeds.studios.map((studio) => [String(studio._id), String(studio.cinema)]),
  );

  const hasMissingReference = (items, getReference, validIds) =>
    items.some((item) => !validIds.has(String(getReference(item))));

  if (
    hasMissingReference(seeds.bioskops, (item) => item.locationId, locationIds) ||
    hasMissingReference(seeds.studios, (item) => item.cinema, bioskopIds) ||
    hasMissingReference(seeds.seats, (item) => item.studioId, studioIds) ||
    hasMissingReference(seeds.showtimes, (item) => item.movieId, movieIds) ||
    hasMissingReference(seeds.showtimes, (item) => item.bioskopId, bioskopIds) ||
    hasMissingReference(seeds.showtimes, (item) => item.studioId, studioIds)
  ) {
    throw new Error("Seed memiliki referensi relasi yang tidak valid.");
  }

  if (
    seeds.showtimes.some(
      (showtime) =>
        studioCinemaById.get(String(showtime.studioId)) !==
        String(showtime.bioskopId),
    )
  ) {
    throw new Error("Studio pada seed showtime tidak dimiliki oleh bioskopnya.");
  }

  assertNoDuplicateKeys(seeds.locations, (item) => item.city, "kota lokasi");
  assertNoDuplicateKeys(seeds.studios, (item) => item.studioId, "kode studio");
  assertNoDuplicateKeys(
    seeds.seats,
    (item) => `${item.studioId}:${item.code}`,
    "kursi studio",
  );

  assertNoDuplicateKeys(
    seeds.showtimes,
    (item) =>
      `${item.bioskopId}:${item.studioId}:${item.date.toISOString()}:${item.startTime}`,
    "jadwal studio",
  );

  for (const studio of seeds.studios) {
    const seatCount = seeds.seats.filter(
      (seat) => String(seat.studioId) === String(studio._id),
    ).length;
    if (seatCount !== studio.rows * studio.seatsPerRow) {
      throw new Error(`Jumlah kursi tidak sesuai untuk studio ${studio.name}.`);
    }
  }
};

const validateSeedDocuments = async () => {
  validateRelations();
  await Promise.all([
    ...seeds.locations.map((item) => new Location(item).validate()),
    ...seeds.bioskops.map((item) => new Bioskop(item).validate()),
    ...seeds.movies.map((item) => new Movie(item).validate()),
    ...seeds.studios.map((item) => new Studio(item).validate()),
    ...seeds.seats.map((item) => new Seat(item).validate()),
    ...seeds.showtimes.map((item) => new Showtime(item).validate()),
  ]);
};

const seedDatabase = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI belum diatur di backend/.env.");
  }

  await validateSeedDocuments();
  await mongoose.connect(process.env.MONGO_URI);

  // Data turunan dibersihkan lebih dulu agar tidak menyisakan referensi lama.
  await Promise.all([
    Transaction.deleteMany({}),
    Booking.deleteMany({}),
    Showtime.deleteMany({}),
    Seat.deleteMany({}),
  ]);
  await Promise.all([
    Studio.deleteMany({}),
    Movie.deleteMany({}),
    Bioskop.deleteMany({}),
    Location.deleteMany({}),
  ]);

  // Hapus index versi lama lalu buat ulang index sesuai schema saat ini.
  await Promise.all([
    Location.syncIndexes(),
    Studio.syncIndexes(),
    Seat.syncIndexes(),
    Showtime.syncIndexes(),
  ]);

  await Location.insertMany(seeds.locations);
  await Bioskop.insertMany(seeds.bioskops);
  await Movie.insertMany(seeds.movies);
  await Studio.insertMany(seeds.studios);
  await Seat.insertMany(seeds.seats);
  await Showtime.insertMany(seeds.showtimes);

  console.log(
    `Seed selesai: ${seeds.bioskops.length} bioskop, ${seeds.studios.length} studio, ${seeds.seats.length} kursi, ${seeds.showtimes.length} jadwal.`,
  );
};

const task = process.argv.includes("--validate")
  ? validateSeedDocuments().then(() => {
      console.log("Validasi seed berhasil.");
    })
  : seedDatabase();

task
  .catch((error) => {
    console.error("Seed gagal:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
