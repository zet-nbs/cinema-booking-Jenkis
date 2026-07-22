const Seat = require("../models/Seat");

// GET semua seat
exports.getAllSeats = async (req, res) => {
  try {
    const seats = await Seat.find().populate("studioId");

    res.status(200).json(seats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET seat berdasarkan ID
exports.getSeatById = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id).populate("studioId");

    if (!seat) {
      return res.status(404).json({
        message: "Seat tidak ditemukan",
      });
    }

    res.status(200).json(seat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET semua seat berdasarkan studioId
exports.getSeatsByStudio = async (req, res) => {
  try {
    const seats = await Seat.find({
      studioId: req.params.studioId,
    }).sort({ code: 1 });

    res.status(200).json(seats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE seat manual
exports.createSeat = async (req, res) => {
  try {
    const seat = await Seat.create(req.body);

    res.status(201).json(seat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GENERATE seat A1 sampai J10 untuk 1 studio
exports.generateSeats = async (req, res) => {
  try {
    const { studioId } = req.body;

    if (!studioId) {
      return res.status(400).json({
        message: "studioId wajib diisi",
      });
    }

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const seats = [];

    rows.forEach((row) => {
      for (let number = 1; number <= 10; number++) {
        seats.push({
          studioId,
          code: `${row}${number}`,
        });
      }
    });

    const createdSeats = await Seat.insertMany(seats, {
      ordered: false,
    });

    res.status(201).json({
      message: "Seats berhasil dibuat",
      total: createdSeats.length,
      data: createdSeats,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// UPDATE seat
exports.updateSeat = async (req, res) => {
  try {
    const seat = await Seat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!seat) {
      return res.status(404).json({
        message: "Seat tidak ditemukan",
      });
    }

    res.status(200).json(seat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE seat
exports.deleteSeat = async (req, res) => {
  try {
    const seat = await Seat.findByIdAndDelete(req.params.id);

    if (!seat) {
      return res.status(404).json({
        message: "Seat tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Seat berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};