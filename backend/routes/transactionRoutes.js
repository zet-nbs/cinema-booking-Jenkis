const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getUserTransactions,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus, // <-- Controller baru
} = require("../controllers/transactionController");

const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Endpoint untuk user
router.post("/", protect, createTransaction);
router.get("/history", protect, getUserTransactions);
router.get("/:id", protect, getTransactionById);

// Endpoint khusus Admin
router.get("/admin/all", protect, requireAdmin, getAllTransactions);
router.put("/admin/:id/status", protect, requireAdmin, updateTransactionStatus); // <-- Route untuk update status (Dummy/Manual)

module.exports = router;
