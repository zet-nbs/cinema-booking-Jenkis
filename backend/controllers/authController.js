const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// REGISTER
// ==========================================
exports.register = async (req, res) => {
  try {
    // TAMBAHAN: Ambil confirmPassword
    const { name, email, password, confirmPassword } = req.body;

    // 1. Validasi input dasar
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    // TAMBAHAN (Test 5): Cek kecocokan password
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password dan konfirmasi password tidak cocok" });
    }

    // 2. Cek duplikat email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Buat User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // TAMBAHAN (Test 3): Tangani error validasi dari Mongoose (seperti format email)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    res.status(500).json({ success: false, message: "Terjadi kesalahan server", error: error.message });
  }
};

// ==========================================
// LOGIN
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password wajib diisi" });
    }

    // TAMBAHAN (Test 11): Paksa email menjadi string murni untuk mencegah NoSQL Injection
    const safeEmail = String(email);

    // 2. Cari user
    const user = await User.findOne({ email: safeEmail });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // 3. Cek password
    const isPasswordMatch = await bcrypt.compare(String(password), user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    // 4. Buat token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Kesalahan server", error: error.message });
  }
};

// ==========================================
// LOGOUT (TAMBAHAN UNTUK TEST 14)
// ==========================================
exports.logout = (req, res) => {
  // Jika frontend menggunakan Bearer token (disimpan di localStorage), 
  // frontend yang bertugas menghapus tokennya.
  // Backend hanya perlu mengirim respons sukses.
  res.status(200).json({
    success: true,
    message: "Logout berhasil. Silakan hapus token di sisi client.",
  });
};

// ==========================================
// GET CURRENT USER (Get Me)
// ==========================================
// Catatan: Ini butuh authMiddleware agar req.user tersedia
exports.getMe = async (req, res) => {
  try {
    // req.user.id didapat dari middleware yang mengecek token JWT
    const user = await User.findById(req.user.id).select("-password"); // Jangan kirim password kembali!

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Kesalahan server",
        error: error.message,
      });
  }
};
