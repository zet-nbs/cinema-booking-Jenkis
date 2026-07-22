const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// 1. MIDDLEWARE PROTECT (Untuk Semua User yang Login)
// ==========================================
exports.protect = async (req, res, next) => {
  let token;

  // Cek apakah token dikirim via Headers (Format: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Memisahkan kata "Bearer" dan mengambil token aslinya di index ke-1
    token = req.headers.authorization.split(" ")[1];
  }
  // Jika kamu menggunakan Cookie Parser (opsional, jika token diset di cookie)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Jika tidak ada token sama sekali
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Tidak ada otorisasi, silakan login terlebih dahulu",
    });
  }

  try {
    // Verifikasi token menggunakan secret key dari file .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cari user di database berdasarkan ID yang ada di payload token
    // Kita gunakan .select('-password') agar data password tidak ikut terbawa
    req.user = await User.findById(decoded.id).select("-password");

    // Token masih dapat lolos verifikasi walaupun akun sudah dihapus.
    // Jangan teruskan nilai null ke controller karena akan menghasilkan 500.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Sesi login tidak lagi valid. Silakan login kembali.",
      });
    }

    // Lanjut ke controller (misalnya getMe)
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah kedaluwarsa",
    });
  }
};

// ==========================================
// 2. MIDDLEWARE REQUIRE ADMIN (Khusus Akses Admin)
// ==========================================
// Catatan: Middleware ini HARUS ditaruh SETELAH middleware `protect` di route
exports.requireAdmin = (req, res, next) => {
  // Cek apakah req.user sudah ada (hasil dari fungsi protect di atas) dan role-nya 'admin'
  if (req.user && req.user.role === "admin") {
    next(); // Lanjut ke controller Admin
  } else {
    // Status 403 Forbidden sesuai syarat dokumen
    return res.status(403).json({
      success: false,
      message: "Akses ditolak, khusus untuk Administrator",
    });
  }
};
