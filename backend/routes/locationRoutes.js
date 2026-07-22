const express = require("express");
const router = express.Router();
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");

// GET semua lokasi
router.get("/", getAllLocations);

// GET lokasi berdasarkan ID
router.get("/:id", getLocationById);

// POST tambah lokasi
router.post("/", protect, requireAdmin, createLocation);

// PUT update lokasi
router.put("/:id", protect, requireAdmin, updateLocation);

// DELETE hapus lokasi
router.delete("/:id", protect, requireAdmin, deleteLocation);

module.exports = router;
