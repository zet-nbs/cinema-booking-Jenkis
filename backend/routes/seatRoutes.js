const express = require("express");
const router = express.Router();

const {
  getAllSeats,
  getSeatById,
  getSeatsByStudio,
  createSeat,
  generateSeats,
  updateSeat,
  deleteSeat,
} = require("../controllers/seatController");

router.get("/", getAllSeats);
router.get("/studio/:studioId", getSeatsByStudio);
router.get("/:id", getSeatById);
router.post("/", createSeat);
router.post("/generate", generateSeats);
router.put("/:id", updateSeat);
router.delete("/:id", deleteSeat);

module.exports = router;