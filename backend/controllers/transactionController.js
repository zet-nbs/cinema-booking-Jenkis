const Transaction = require("../models/Transaction");
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");

// 1. Membuat Transaksi Baru
exports.createTransaction = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
    });
    if (!booking) {
      return res.status(404).json({ message: "Data booking tidak ditemukan" });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Booking ini sudah diproses sebelumnya" });
    }

    const transaction = await Transaction.create({
      bookingId,
      userId: req.user.id,
      amount,
      paymentMethod,
      status: "success",      // Dummy: langsung dianggap berhasil
      paymentDate: new Date(),
    });

    // Booking otomatis confirmed ketika transaksi sukses
    await Booking.findByIdAndUpdate(bookingId, { status: "confirmed" });

    res.status(201).json({
      success: true,
      message: "Transaksi berhasil dibuat. Booking Anda telah dikonfirmasi!",
      data: transaction,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal membuat transaksi", error: error.message });
  }
};

// 2. Mengambil Riwayat Transaksi User
exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate("bookingId", "movieId showTime seats")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil riwayat transaksi",
      error: error.message,
    });
  }
};

// 3. Mengambil Semua Transaksi (Admin)
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name email")
      .populate("bookingId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data transaksi",
      error: error.message,
    });
  }
};

// 4. Mengambil Detail Satu Transaksi
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("bookingId")
      .populate("userId", "name email");

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    if (
      transaction.userId._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Tidak memiliki akses ke transaksi ini" });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

// 5. UPDATE STATUS TRANSAKSI MANUAL (SIMULASI / ADMIN)
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const transactionId = req.params.id;

    // Validasi input status yang diperbolehkan
    const validStatuses = [
      "pending",
      "success",
      "failed",
      "expired",
      "refunded",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Input status tidak valid" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    // Update status di collection Transaction
    transaction.status = status;

    // Jika sukses, catat waktu pembayarannya
    if (status === "success") {
      transaction.paymentDate = Date.now();
    }

    await transaction.save();

    // SINKRONISASI dengan collection Booking
    if (status === "success") {
      // Pembayaran berhasil, tiket dikonfirmasi
      await Booking.findByIdAndUpdate(transaction.bookingId, {
        status: "confirmed",
      });
    } else if (
      status === "failed" ||
      status === "refunded" ||
      status === "expired"
    ) {
      // Transaksi gagal/dikembalikan, batalkan booking dan lepas kursinya
      const booking = await Booking.findById(transaction.bookingId);
      if (booking && booking.status !== "cancelled") {
        // Release seats from showtime
        if (booking.seats.length > 0) {
          await Showtime.findByIdAndUpdate(booking.showtimeId, {
            $pull: { bookedSeats: { $in: booking.seats } },
          });
        }
        booking.status = "cancelled";
        await booking.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Status transaksi berhasil diperbarui menjadi ${status}`,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal memperbarui status transaksi",
      error: error.message,
    });
  }
};

exports.adminCreateTransaction = async (req, res) => {
  try {
    const { bookingId, paymentMethod, status = 'pending' } = req.body;
    if (!bookingId || !paymentMethod) return res.status(400).json({ success: false, message: 'Booking dan metode pembayaran wajib diisi' });
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
    const transaction = await Transaction.create({
      bookingId,
      userId: booking.userId,
      amount: booking.totalPrice,
      paymentMethod,
      status,
      paymentDate: status === 'success' ? new Date() : undefined,
    });
    if (status === 'success') {
      await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed' });
    }
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    res.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
