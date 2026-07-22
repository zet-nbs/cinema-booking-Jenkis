const Showtime = require("../models/Showtime");

// GET /api/showtimes
// Public
// Mengambil seluruh showtime + search + filter + pagination
exports.getAllShowtimes = async (req, res) => {
  try {
    // Query yang diperbolehkan
    const allowedQueries = [
      "search",
      "genre",
      "location",
      "bioskop",
      "date",
      "page",
      "limit",
    ];

    // Cari query yang tidak dikenal
    const invalidQuery = Object.keys(req.query).find(
      (key) => !allowedQueries.includes(key),
    );

    if (invalidQuery) {
      return res.status(400).json({
        success: false,
        message: `Query parameter '${invalidQuery}' tidak dikenali. Gunakan parameter yang valid.`,
        allowedQueries,
      });
    }

    const {
      search,
      genre,
      location,
      bioskop,
      date,
      page = 1,
      limit = 20,
    } = req.query;

    // Query dasar (langsung ke collection Showtime)
    let query = {};

    if (date) {
      query.date = date;
    }

    // Ambil seluruh showtime beserta relasinya
    let showtimes = await Showtime.find(query)
      .populate("movieId")
      .populate("studioId")
      .populate({
        path: "bioskopId",
        populate: {
          path: "locationId",
        },
      })
      .sort({
        date: 1,
        time: 1,
      });

    // Search Judul Movie
    if (search) {
      showtimes = showtimes.filter((item) =>
        item.movieId.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filter Genre
    if (genre) {
      showtimes = showtimes.filter(
        (item) => item.movieId.genre.toLowerCase() === genre.toLowerCase(),
      );
    }

    // Filter Kota
    if (location) {
      showtimes = showtimes.filter(
        (item) =>
          item.bioskopId.locationId.city.toLowerCase() ===
          location.toLowerCase(),
      );
    }

    // Filter Bioskop
    if (bioskop) {
      showtimes = showtimes.filter(
        (item) => item.bioskopId.name.toLowerCase() === bioskop.toLowerCase(),
      );
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const totalItems = showtimes.length;

    const startIndex = (pageNumber - 1) * limitNumber;

    const paginatedData = showtimes.slice(startIndex, startIndex + limitNumber);

    res.status(200).json({
      success: true,
      page: pageNumber,
      limit: limitNumber,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNumber),
      data: paginatedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data showtime",
      error: error.message,
    });
  }
};

// GET /api/movies/:movieId/showtimes
// Public
// Mengambil seluruh jadwal tayang berdasarkan movie
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    const showtimes = await Showtime.find({ movieId })
      .populate("movieId")
      .populate("bioskopId", "name address")
      .populate("studioId")
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar showtime",
      error: error.message,
    });
  }
};

// GET /api/showtimes/:id
// Public
// Mengambil detail satu showtime
exports.getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movieId")
      .populate("studioId")
      .populate({
        path: "bioskopId",
        populate: {
          path: "locationId",
          select: "city",
        },
      });

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail showtime",
      error: error.message,
    });
  }
};

// GET /api/showtimes/:id/seats
// Public
// Mengambil daftar kursi yang sudah dipesan
exports.getSeatAvailability = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate(
      "bookedSeats",
      "code",
    ); // populate hanya field code

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      bookedSeats: showtime.bookedSeats, // [{ _id, code }]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data kursi",
      error: error.message,
    });
  }
};

// POST /api/showtimes
// Admin
// Menambahkan jadwal tayang baru
exports.createShowtime = async (req, res) => {
  try {
    const {
      movieId,
      bioskopId,
      date,
      startTime,
      endTime,
      studio,
      studioId,
      price,
      bookedSeats,
    } = req.body;

    // Validasi field wajib
    if (
      !movieId ||
      !bioskopId ||
      !date ||
      !startTime ||
      !endTime ||
      !studio ||
      !studioId ||
      !price
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib harus diisi",
      });
    }

    // Cek apakah studio sudah memiliki jadwal pada waktu yang sama
    const existingShowtime = await Showtime.findOne({
      bioskopId,
      studio,
      studioId,
      date,
      startTime,
      endTime,
    });

    if (existingShowtime) {
      return res.status(409).json({
        success: false,
        message: "Studio sudah memiliki jadwal pada waktu tersebut",
      });
    }

    const showtime = await Showtime.create({
      movieId,
      bioskopId,
      studioId,
      date,
      startTime,
      endTime,
      studio,
      price,
      bookedSeats: bookedSeats || [],
    });

    res.status(201).json({
      success: true,
      message: "Showtime berhasil ditambahkan",
      data: showtime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal membuat showtime",
      error: error.message,
    });
  }
};

// PUT /api/showtimes/:id
// Admin
// Memperbarui jadwal tayang
exports.updateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Showtime berhasil diperbarui",
      data: showtime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui showtime",
      error: error.message,
    });
  }
};

// DELETE /api/showtimes/:id
// Admin
// Menghapus jadwal tayang
exports.deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Showtime berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus showtime",
      error: error.message,
    });
  }
};
