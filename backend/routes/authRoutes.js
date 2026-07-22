const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/authMiddleware");

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    message: "Terlalu banyak percobaan login, coba lagi setelah 5 menit",
  },
});

// Endpoint Publik
router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);

module.exports = router;
