const express = require("express");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

const {
  getAllBioskop,
  getBioskopById,
  createBioskop,
  updateBioskop,
  deleteBioskop,
} = require("../controllers/bioskopController");

router.get("/", getAllBioskop);
router.get("/:id", getBioskopById);
router.post("/", protect, requireAdmin, createBioskop);
router.put("/:id", protect, requireAdmin, updateBioskop);
router.delete("/:id", protect, requireAdmin, deleteBioskop);
module.exports = router;
