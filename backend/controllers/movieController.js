const Movie = require('../models/Movie');
const fs = require('fs');
const path = require('path');

exports.getMovies = async (req, res, next) => {
  try {
    const { search, genre, page = 1, limit = 20 } = req.query;
    

    let query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (genre) {
      query.genre = genre;
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const movies = await Movie.find(query).skip(skip).limit(limitNumber);
    const totalItems = await Movie.countDocuments(query);

    res.status(200).json({
      success: true,
      data: movies,
      page: pageNumber,
      limit: limitNumber,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNumber)
    });
  } catch (error) {
    next(error); 
  }
};



exports.getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    next(error);
  }
};

exports.createMovie = async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({ success: true, data: movie });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    // Hapus file poster dari server jika ada sebelum menghapus dari DB
    if (movie.poster) {
      const relativePath = movie.poster.replace(/^\/uploads\//, 'uploads/');
      const posterPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(posterPath)) {
        try {
          fs.unlinkSync(posterPath);
        } catch (err) {
          console.error("Gagal menghapus file poster saat menghapus movie:", err.message);
        }
      }
    }

    await Movie.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPLOAD / UPDATE MOVIE POSTER
// ==========================================
exports.uploadPoster = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Silakan unggah file gambar" });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      // Hapus file yang baru diupload karena movie tidak ditemukan
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Movie tidak ditemukan" });
    }

    // Jika movie sudah memiliki poster lama, hapus file lamanya dari server
    if (movie.poster) {
      const relativePath = movie.poster.replace(/^\/uploads\//, 'uploads/');
      const oldPosterPath = path.join(process.cwd(), relativePath);
      
      if (fs.existsSync(oldPosterPath)) {
        try {
          fs.unlinkSync(oldPosterPath);
        } catch (err) {
          console.error("Gagal menghapus poster lama:", err.message);
        }
      }
    }

    // Simpan relative path ke database
    const posterRelativePath = `/uploads/${req.file.filename}`;
    movie.poster = posterRelativePath;
    await movie.save();

    // Buat full URL dinamis agar siap diintegrasikan dengan frontend
    const fullPosterUrl = `${req.protocol}://${req.get("host")}${posterRelativePath}`;

    res.status(200).json({
      success: true,
      message: "Poster berhasil diunggah",
      data: {
        id: movie._id,
        title: movie.title,
        posterPath: posterRelativePath,
        posterUrl: fullPosterUrl,
      },
    });
  } catch (error) {
    // Hapus file yang baru saja diunggah jika terjadi error database
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Gagal menghapus file saat rollback error:", err.message);
      }
    }
    next(error);
  }
};

// ==========================================
// FETCH MOVIE POSTER URL
// ==========================================
exports.getPoster = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie tidak ditemukan" });
    }

    if (!movie.poster) {
      return res.status(404).json({ success: false, message: "Movie belum memiliki poster" });
    }

    // Buat full URL dinamis agar siap digunakan langsung oleh frontend
    const fullPosterUrl = `${req.protocol}://${req.get("host")}${movie.poster}`;

    res.status(200).json({
      success: true,
      data: {
        id: movie._id,
        title: movie.title,
        posterPath: movie.poster,
        posterUrl: fullPosterUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE MOVIE POSTER
// ==========================================
exports.deletePoster = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie tidak ditemukan" });
    }

    if (!movie.poster) {
      return res.status(400).json({ success: false, message: "Movie belum memiliki poster untuk dihapus" });
    }

    // Hapus file poster dari server
    const relativePath = movie.poster.replace(/^\/uploads\//, 'uploads/');
    const posterPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(posterPath)) {
      try {
        fs.unlinkSync(posterPath);
      } catch (err) {
        console.error("Gagal menghapus file poster:", err.message);
      }
    }

    // Set field poster ke undefined di database
    movie.poster = undefined;
    await movie.save();

    res.status(200).json({
      success: true,
      message: "Poster berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};