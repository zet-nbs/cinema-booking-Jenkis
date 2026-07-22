const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    genre: {
      type: [String],
      required: [true, "Genre is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be positive"],
    },
    rating: {
      type: String,
    },
    poster: {
      type: String,
    },
    backgroundImage: {
      type: String,
    },
    description: {
      type: String,
    },
    director: {
      type: String,
    },
    cast: {
      type: [String],
      default: [],
    },
    trailer: {
      type: String,
    },
    release_date: {
      type: Date,
      required: true, // Ubah jadi false jika tidak wajib diisi
    },
    release: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Movie", movieSchema);
