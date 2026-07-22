import api from './api';

export const transactionService = {
  async createTransaction({ bookingId, amount, paymentMethod }) {
    const { data } = await api.post('/transactions', { bookingId, amount, paymentMethod });
    if (!data.success) throw new Error(data.message || 'Gagal membuat transaksi');
    return data.data;
  },

  async getHistory() {
    const { data } = await api.get('/transactions/history');
    if (!data.success) throw new Error(data.message || 'Gagal memuat riwayat transaksi');
    return data.data || [];
  },
};
