const express = require('express');
const router = express.Router();
const { 
  getMovies, 
  getMovieById, 
  createMovie, 
  updateMovie, 
  deleteMovie,
  uploadPoster,
  getPoster,
  deletePoster
} = require('../controllers/movieController');

const { protect, requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get("/", getMovies);
router.get("/:id", getMovieById);
router.post("/", protect, requireAdmin, createMovie);
router.put("/:id", protect, requireAdmin, updateMovie);
router.delete("/:id", protect, requireAdmin, deleteMovie);

// Router untuk mengupload/mengubah, mengambil, dan menghapus URL poster film
router.put("/:id/poster", upload.single("poster"), uploadPoster);
router.get("/:id/poster", getPoster);
router.delete("/:id/poster", deletePoster);

module.exports = router;