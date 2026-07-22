const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const userController = require("../controllers/userController");
const { getAllTransactions, adminCreateTransaction, updateTransactionStatus, deleteTransaction } = require('../controllers/transactionController');
const { protect, requireAdmin } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, requireAdmin, adminController.getDashboard);

router.get(
  "/booking",
  protect,
  requireAdmin,
  adminController.getBookingSummary,
);

router.get("/report", protect, requireAdmin, adminController.getReport);
router.get('/roles', protect, requireAdmin, (_req, res) => res.json([{ _id: 'user', name: 'User' }, { _id: 'admin', name: 'Admin' }]));
router.get('/payment-methods', protect, requireAdmin, (_req, res) => res.json(['QRIS', 'E-wallet', 'Virtual Account', 'Credit Card'].map((name) => ({ _id: name, name }))));
router.get('/transaction-statuses', protect, requireAdmin, (_req, res) => res.json(['pending', 'success', 'failed', 'expired', 'refunded'].map((name) => ({ _id: name, name }))));

router.route('/users')
  .get(protect, requireAdmin, userController.getUsers)
  .post(protect, requireAdmin, userController.createUser);
router.route('/users/:id')
  .put(protect, requireAdmin, userController.updateUser)
  .delete(protect, requireAdmin, userController.deleteUser);

router.route('/transactions')
  .get(protect, requireAdmin, getAllTransactions)
  .post(protect, requireAdmin, adminCreateTransaction);
router.route('/transactions/:id')
  .put(protect, requireAdmin, updateTransactionStatus)
  .delete(protect, requireAdmin, deleteTransaction);

module.exports = router;
