const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Movie wajib dipilih"],
    },

    bioskopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bioskop",
      required: [true, "Bioskop wajib dipilih"],
    },

    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: [true, "Studio wajib dipilih"],
    },

    date: {
      type: Date,
      required: [true, "Tanggal wajib diisi"],
    },

    startTime: {
      type: String,
      required: [true, "Jam tayang wajib diisi"],
    },

    endTime: {
      type: String,
      required: [true, "Jam selesai wajib diisi"],
    },

    price: {
      type: Number,
      required: [true, "Harga tiket wajib diisi"],
      min: [0, "Harga tidak boleh negatif"],
    },

    bookedSeats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
        default: [],
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Satu studio tidak boleh memiliki dua jadwal pada waktu yang sama.
showtimeSchema.index(
  {
    bioskopId: 1,
    studioId: 1,
    date: 1,
    startTime: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Showtime", showtimeSchema);
