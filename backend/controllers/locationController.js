const Location = require("../models/Location");

/**
 * GET /api/locations
 * Ambil semua lokasi
 */
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ city: 1 });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/locations/:id
 * Ambil lokasi berdasarkan ID
 */
exports.getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Lokasi tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/locations
 * Tambah lokasi baru
 */
exports.createLocation = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Nama kota wajib diisi",
      });
    }

    const existingLocation = await Location.findOne({ city });

    if (existingLocation) {
      return res.status(409).json({
        success: false,
        message: "Kota sudah ada",
      });
    }

    const location = await Location.create({ city });

    res.status(201).json({
      success: true,
      message: "Lokasi berhasil ditambahkan",
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/locations/:id
 * Update lokasi
 */
exports.updateLocation = async (req, res) => {
  try {
    const { city } = req.body;

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { city },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Lokasi tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lokasi berhasil diperbarui",
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/locations/:id
 * Hapus lokasi
 */
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Lokasi tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lokasi berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};