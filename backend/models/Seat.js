const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio", // nanti samain sama nama model Studio temanmu
      required: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Biar dalam 1 studio nggak boleh ada kursi dobel, misal A1 dobel
seatSchema.index({ studioId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);