const multer = require("multer");
const path = require("path");

// Konfigurasi Penyimpanan File
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Menyimpan file di folder 'uploads' di root direktori backend
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    // Membuat nama file yang unik menggunakan timestamp dan angka acak
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter File (Hanya mengizinkan file gambar)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|webp/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Hanya file gambar (JPEG, JPG, PNG, WEBP) yang diperbolehkan!"), false);
  }
};

// Batasan ukuran file (maksimal 5MB)
const limits = {
  fileSize: 5 * 1024 * 1024,
};

// Inisialisasi Multer
const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = upload;
