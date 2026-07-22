import api from './api';
import { normalizeBooking } from './bookingService';

export const adminService = {
  async getDashboardStats() {
    const { data } = await api.get('/admin/dashboard');
    if (!data.success) throw new Error(data.message || 'Gagal memuat dashboard');
    const stats = data.data;
    return {
      totalMovies: stats.totalMovie,
      totalHalls: stats.totalStudio,
      totalShowtimes: stats.totalShowtimes,
      totalBookings: stats.totalBookings,
      totalUsers: stats.totalUsers,
      totalRevenue: stats.totalRevenue,
      recentBookings: (stats.recentBookings || []).map(normalizeBooking),
      popularMovies: (stats.popularMovies || []).map((movie) => ({
        ...movie,
        seats: movie.totalSeats,
      })),
    };
  },

  async getAllBookings() {
    const { data } = await api.get('/bookings');
    if (!data.success) throw new Error(data.message || 'Gagal memuat booking');
    return (data.data || []).map(normalizeBooking);
  },

  async getBookingById(id) {
    const { data } = await api.get(`/bookings/${id}`);
    if (!data.success) throw new Error(data.message || 'Booking tidak ditemukan');
    return normalizeBooking(data.data);
  },

  async updateBookingStatus(id, status) {
    const { data } = await api.put(`/bookings/${id}`, { status });
    if (!data.success) throw new Error(data.message || 'Gagal mengubah status booking');
    return normalizeBooking(data.data);
  },

  async getReport() {
    const { data } = await api.get('/admin/report');
    if (!data.success) throw new Error(data.message || 'Gagal memuat laporan');
    return data.data;
  },
};
