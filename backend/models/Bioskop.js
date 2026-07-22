const mongoose = require('mongoose');

const bioskopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bioskop', bioskopSchema);