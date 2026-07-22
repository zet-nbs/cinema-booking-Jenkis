const mongoose = require("mongoose");

const StudioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    studioId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    totalSeats: {
      type: Number,
      required: true,
    },

    rows: {
      type: Number,
      required: true,
    },

    seatsPerRow: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "maintenance"
      ],
      default: "active",
    },

    cinema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bioskop",
    },

  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("Studio", StudioSchema);
