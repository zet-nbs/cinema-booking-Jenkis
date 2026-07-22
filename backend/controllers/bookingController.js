const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const Seat = require("../models/Seat");

/**
 * Auto-cancel pending bookings older than 5 minutes and free their seats.
 * Called by the scheduler in app.js every minute.
 */
const cancelExpiredBookings = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const expired = await Booking.find({
      status: "pending",
      createdAt: { $lt: fiveMinutesAgo },
    });

    for (const booking of expired) {
      // Restore seats back to showtime so others can book them
      await Showtime.findByIdAndUpdate(booking.showtimeId, {
        $pull: { bookedSeats: { $in: booking.seats } },
      });
      booking.status = "cancelled";
      await booking.save();
    }

    if (expired.length > 0) {
      console.log(`[Scheduler] Auto-cancelled ${expired.length} expired booking(s).`);
    }
  } catch (err) {
    console.error("[Scheduler] Error cancelling expired bookings:", err.message);
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId")
      .populate("movieId")
      .populate({
        path: "showtimeId",
        populate: [
          { path: "movieId" },
          { path: "bioskopId", populate: { path: "locationId" } },
          { path: "studioId" },
        ],
      })
      .populate("seats"); // populate detail kursi

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId")
      .populate("movieId")
      .populate({
        path: "showtimeId",
        populate: [
          { path: "movieId" },
          { path: "bioskopId", populate: { path: "locationId" } },
          { path: "studioId" },
        ],
      })
      .populate("seats"); // populate detail kursi

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createBooking = async (req, res) => {
  try {
    const { userId, movieId, showtimeId, seats } = req.body; // seats: ["A1", "A2"]

    // 1. CEK SHOWTIME
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res
        .status(404)
        .json({ success: false, message: "Jadwal tayang tidak ditemukan" });
    }

    // 2. CARI OBJECT ID KURSI BERDASARKAN KODE (A1, A2) DI STUDIO YANG SAMA
    const seatDocs = await Seat.find({
      studioId: showtime.studioId,
      code: { $in: seats }, // Mencari semua kursi yang ada di array string
    });

    // Ambil array ObjectId aslinya
    const seatIds = seatDocs.map((seat) => seat._id.toString());

    // Validasi apakah kursi yang diklik benar-benar ada di database
    if (seatIds.length !== seats.length) {
      return res.status(400).json({
        success: false,
        message: "Beberapa kursi tidak valid atau tidak ditemukan",
      });
    }

    // Validasi apakah kursi sudah di-booking sebelumnya oleh orang lain (Mencegah bentrok)
    const alreadyBooked = seatIds.some((id) =>
      showtime.bookedSeats.includes(id),
    );
    if (alreadyBooked) {
      return res.status(409).json({
        success: false,
        message: "Mohon maaf, kursi tersebut baru saja dipesan oleh orang lain",
      });
    }

    // 3. KALKULASI TOTAL HARGA DI BACKEND (Lebih aman dari dimanipulasi frontend)
    const totalPrice = seats.length * showtime.price;

    // 4. BIKIN DATA BOOKING BARU (Status: pending)
    const booking = await Booking.create({
      userId,
      movieId,
      showtimeId,
      seats: seatIds, // Memasukkan ObjectId kursi
      totalPrice,
    });

    // 5. UPDATE SHOWTIME BOOKED SEATS
    // Dorong semua ObjectId kursi baru ke array bookedSeats milik Showtime
    showtime.bookedSeats.push(...seatIds);
    await showtime.save();

    res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat!",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membuat booking",
      error: error.message,
    });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { status } = req.body;

    // If cancelling, release the seats first
    if (status === "cancelled") {
      const existing = await Booking.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (existing.status !== "cancelled" && existing.seats.length > 0) {
        await Showtime.findByIdAndUpdate(existing.showtimeId, {
          $pull: { bookedSeats: { $in: existing.seats } },
        });
      }
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  cancelExpiredBookings,
};
