const express = require("express");
const router = express.Router();
const {
  createGenre,
  getGenres,
  getGenreById,
  updateGenre,
  deleteGenre,
} = require("../controllers/genreController");

// Import middleware autentikasi dan role
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Rute untuk mendapatkan semua genre dan membuat genre baru
router
  .route("/")
  .get(getGenres) // Akses: Publik (Siapa saja bisa melihat daftar genre)
  .post(protect, requireAdmin, createGenre); // Akses: Private & Admin (Hanya admin yang bisa membuat genre)

// Rute spesifik berdasarkan ID untuk Get One, Update, dan Delete
router
  .route("/:id")
  .get(getGenreById) // Akses: Publik (Siapa saja bisa melihat detail genre)
  .put(protect, requireAdmin, updateGenre) // Akses: Private & Admin
  .delete(protect, requireAdmin, deleteGenre); // Akses: Private & Admin

module.exports = router;
