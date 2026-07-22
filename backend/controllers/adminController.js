const Movie = require("../models/Movie");
const Bioskop = require("../models/Bioskop");
const Showtime = require("../models/Showtime");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

/**
 * ==============================
 * Dashboard Admin
 * ==============================
 * Total Movie
 * Total Studio
 * Total Showtimes
 * Total Bookings
 * Total Users
 * Total Revenue
 * Recent Booking
 * Popular Movie (Count Seats)
 */
exports.getDashboard = async (req, res) => {
  try {
    const [totalMovie, totalStudio, totalShowtimes, totalBookings, totalUsers] =
      await Promise.all([
        Movie.countDocuments(),
        Bioskop.countDocuments(),
        Showtime.countDocuments(),
        Booking.countDocuments(),
        User.countDocuments(),
      ]);

    // Total Revenue
    const revenue = await Transaction.aggregate([
      {
        $match: {
          status: "success",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$amount",
          },
        },
      },
    ]);

    // Recent Booking
    const recentBookings = await Booking.find()
      .populate("userId", "name email")
      .populate("movieId", "title poster")
      .sort({ createdAt: -1 })
      .limit(5);

    // Popular Movie (berdasarkan jumlah seat terjual)
    const popularMovies = await Booking.aggregate([
      {
        $group: {
          _id: "$movieId",
          totalBookings: {
            $sum: 1,
          },
          totalSeats: {
            $sum: {
              $size: "$seats",
            },
          },
        },
      },
      {
        $sort: {
          totalSeats: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movie",
        },
      },
      {
        $unwind: "$movie",
      },
      {
        $project: {
          movieId: "$_id",
          title: "$movie.title",
          poster: "$movie.poster",
          genre: "$movie.genre",
          totalBookings: 1,
          totalSeats: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMovie,
        totalStudio,
        totalShowtimes,
        totalBookings,
        totalUsers,
        totalRevenue: revenue[0]?.totalRevenue || 0,
        recentBookings,
        popularMovies,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ==============================
 * Booking Dashboard
 * ==============================
 * Total Booking
 * Total Transaction Success
 * Total Transaction Pending
 * Total Revenue Booking
 */
exports.getBookingSummary = async (req, res) => {
  try {
    const [totalBooking, successTransaction, pendingTransaction] =
      await Promise.all([
        Booking.countDocuments(),
        Transaction.countDocuments({ status: "success" }),
        Transaction.countDocuments({ status: "pending" }),
      ]);

    const revenue = await Transaction.aggregate([
      {
        $match: {
          status: "success",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$amount",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBooking,
        successTransaction,
        pendingTransaction,
        totalRevenue: revenue[0]?.totalRevenue || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ==============================
 * Report Dashboard
 * ==============================
 * Today Revenue
 * Weekly Revenue
 * Now Showing
 * Active Showtimes
 */
exports.getReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's revenue — use createdAt as fallback when paymentDate is null (dummy transactions)
    const todayRevAgg = await Transaction.aggregate([
      {
        $match: {
          status: "success",
          $or: [
            { paymentDate: { $gte: today, $lt: tomorrow } },
            { paymentDate: null, createdAt: { $gte: today, $lt: tomorrow } },
            { paymentDate: { $exists: false }, createdAt: { $gte: today, $lt: tomorrow } },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Weekly revenue — daily breakdown for the bar chart (last 7 days)
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 6);

    const weeklyAgg = await Transaction.aggregate([
      {
        $match: {
          status: "success",
          $or: [
            { paymentDate: { $gte: lastWeek } },
            { paymentDate: null, createdAt: { $gte: lastWeek } },
            { paymentDate: { $exists: false }, createdAt: { $gte: lastWeek } },
          ],
        },
      },
      {
        $project: {
          amount: 1,
          dateUsed: {
            $ifNull: ["$paymentDate", "$createdAt"],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dateUsed" },
          },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const weeklyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const found = weeklyAgg.find((x) => x._id === dateStr);
      weeklyRevenue.push({
        date: dateStr.slice(5), // MM-DD for display
        revenue: found ? found.revenue : 0,
      });
    }

    // Now showing: movies with release = true
    const nowShowingMovies = await Movie.countDocuments({ release: true });

    // Active halls: unique active showtimes' studios
    const activeHalls = await Showtime.countDocuments({ isActive: true });

    // All confirmed bookings for report table
    const confirmedBookings = await Booking.find({ status: "confirmed" })
      .populate("userId", "name email")
      .populate("movieId", "title poster")
      .populate({ path: "showtimeId", populate: { path: "studioId", select: "name" } })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        todayRevenue: todayRevAgg[0]?.total || 0,
        weeklyRevenue,
        nowShowingMovies,
        activeHalls,
        confirmedBookings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
