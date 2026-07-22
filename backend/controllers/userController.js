const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getUsers = async (_req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
};

exports.createUser = async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, role });
  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

exports.updateUser = async (req, res) => {
  const { name, email, role, password } = req.body;
  const updates = { name, email, role };
  Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
  if (password) updates.password = await bcrypt.hash(password, 10);
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
  res.json({ success: true, data: user });
};

exports.deleteUser = async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'Admin tidak dapat menghapus akun sendiri' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
  res.json({ success: true, message: 'User berhasil dihapus' });
};
