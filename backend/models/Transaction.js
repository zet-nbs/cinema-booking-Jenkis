const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['QRIS', 'E-wallet', 'Virtual Account', 'Credit Card'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'expired', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentGatewayResponse: { 
    type: mongoose.Schema.Types.Mixed 
  }
}, { timestamps: true }); 

module.exports = mongoose.model('Transaction', transactionSchema);