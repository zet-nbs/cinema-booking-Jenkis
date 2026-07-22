const Bioskop = require("../models/Bioskop");

exports.getAllBioskop = async (req, res) => {
  try {
    const bioskop = await Bioskop.find().populate("locationId");

    res.status(200).json(bioskop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBioskopById = async (req, res) => {
  try {
    const bioskop = await Bioskop.findById(req.params.id).populate("locationId");

    if (!bioskop)
      return res.status(404).json({
        message: "Bioskop tidak ditemukan",
      });

    res.status(200).json(bioskop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBioskop = async (req, res) => {
  try {
    const bioskop = await Bioskop.create(req.body);

    res.status(201).json(bioskop);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateBioskop = async (req, res) => {
  try {
    const bioskop = await Bioskop.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!bioskop)
      return res.status(404).json({
        message: "Bioskop tidak ditemukan",
      });

    res.status(200).json(bioskop);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBioskop = async (req, res) => {
  try {
    const bioskop = await Bioskop.findByIdAndDelete(req.params.id);

    if (!bioskop)
      return res.status(404).json({
        message: "Bioskop tidak ditemukan",
      });

    res.status(200).json({
      message: "Bioskop berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};