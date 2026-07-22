const mongoose = require("mongoose");

const genreSchema = new mongoose.Schema(
  {
    genre: {
      type: String,
      required: [true, "Nama genre wajib diisi"],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Genre", genreSchema);
