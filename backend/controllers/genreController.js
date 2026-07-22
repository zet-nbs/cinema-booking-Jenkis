const Genre = require("../models/genreModel");

// @desc    Membuat genre baru
// @route   POST /api/genres
// @access  Public/Private (tergantung setup autentikasi)
const createGenre = async (req, res) => {
  try {
    const { genre } = req.body;

    // Cek apakah genre sudah ada (opsional, karena schema sudah memiliki 'unique',
    // tapi ini memberikan pesan error yang lebih rapi)
    const genreExists = await Genre.findOne({ genre });
    if (genreExists) {
      return res.status(400).json({ message: "Genre sudah terdaftar" });
    }

    const newGenre = await Genre.create({ genre });
    res.status(201).json(newGenre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mendapatkan semua genre
// @route   GET /api/genres
// @access  Public
const getGenres = async (req, res) => {
  try {
    const genres = await Genre.find({}).sort({ genre: 1 }); // Diurutkan berdasarkan alfabet
    res.status(200).json(genres);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mendapatkan satu genre berdasarkan ID
// @route   GET /api/genres/:id
// @access  Public
const getGenreById = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({ message: "Genre tidak ditemukan" });
    }

    res.status(200).json(genre);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Memperbarui genre berdasarkan ID
// @route   PUT /api/genres/:id
// @access  Public/Private
const updateGenre = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({ message: "Genre tidak ditemukan" });
    }

    const updatedGenre = await Genre.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.status(200).json(updatedGenre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Menghapus genre berdasarkan ID
// @route   DELETE /api/genres/:id
// @access  Public/Private
const deleteGenre = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({ message: "Genre tidak ditemukan" });
    }

    await Genre.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Genre berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGenre,
  getGenres,
  getGenreById,
  updateGenre,
  deleteGenre,
};
