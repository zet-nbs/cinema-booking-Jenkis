const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Location = require("../models/Location");
const Bioskop = require("../models/Bioskop");
const Movie = require("../models/Movie");
const Studio = require("../models/Studio");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

const autoSeed = async () => {
  try {
    const movieCount = await Movie.countDocuments();
    if (movieCount > 0) {
      console.log("[AutoSeed] Database already has movies. Skipping autoseed.");
      return;
    }

    console.log("[AutoSeed] Database is empty. Starting autoseed...");

    // 1. Read seed JSON files
    const readSeed = (file) =>
      mongoose.mongo.BSON.EJSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "seed", file), "utf8"),
      );

    const locations = readSeed("locations.json");
    const bioskops = readSeed("bioskops.json");
    const movies = readSeed("movies.json");
    const studioSeeds = readSeed("studio.json");
    const seats = readSeed("seat.json");
    const showtimeSeeds = readSeed("showtime.json");

    // Normalize studios and showtimes just like in seed.js
    const studioCodeCount = studioSeeds.reduce((counts, studio) => {
      counts.set(studio.studioId, (counts.get(studio.studioId) || 0) + 1);
      return counts;
    }, new Map());

    const normalizedStudios = studioSeeds.map((studio) => {
      if (studioCodeCount.get(studio.studioId) === 1) return studio;
      return {
        ...studio,
        studioId: `${studio.studioId}-${String(studio._id).slice(-6)}`,
      };
    });

    const movieDurations = new Map(
      movies.map((movie) => [String(movie._id), movie.duration]),
    );

    const addMinutesToTime = (time, minutes) => {
      const [hours, minutesPart] = time.split(":").map(Number);
      const totalMinutes = hours * 60 + minutesPart + minutes;
      return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(
        totalMinutes % 60,
      ).padStart(2, "0")}`;
    };

    const normalizedShowtimes = showtimeSeeds.map((showtime) => ({
      ...showtime,
      endTime:
        showtime.endTime ||
        addMinutesToTime(
          showtime.startTime,
          movieDurations.get(String(showtime.movieId)),
        ),
    }));

    // 2. Insert records
    await Location.insertMany(locations);
    await Bioskop.insertMany(bioskops);
    await Movie.insertMany(movies);
    await Studio.insertMany(normalizedStudios);
    await Seat.insertMany(seats);
    await Showtime.insertMany(normalizedShowtimes);

    console.log("[AutoSeed] Base catalog successfully seeded.");

    // 3. Create default admin if no admin user exists
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Admin CinemaFlix",
        email: "admin@admin.com",
        password: hashedPassword,
        role: "admin",
      });
      console.log("[AutoSeed] Created default admin user: admin@admin.com / admin123");
    }

    console.log("[AutoSeed] Autoseed completed successfully.");
  } catch (error) {
    console.error("[AutoSeed] Error during autoseed:", error.message);
  }
};

module.exports = autoSeed;
