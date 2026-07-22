const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const bioskopRoutes = require("./routes/bioskopRoutes");
const movieRoutes = require("./routes/movieRoutes");
const seatRoutes = require("./routes/seatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const showtimeRoutes = require("./routes/showtimeRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const studioRoutes = require("./routes/studioRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { cancelExpiredBookings } = require("./controllers/bookingController");

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true, // izinkan cookie dikirim
}));
// Pastikan folder uploads ada
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(cookieParser());

// Serve static files dari folder uploads
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/bioskop", bioskopRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/studios", studioRoutes);
app.use("/api/admin", adminRoutes);

// ── Auto-cancel pending bookings older than 5 minutes (runs every 60 s) ──
setInterval(cancelExpiredBookings, 60 * 1000);
console.log("[Scheduler] Booking expiry checker started (every 60 s).");

module.exports = app;
