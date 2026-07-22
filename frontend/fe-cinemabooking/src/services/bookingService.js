import api from './api';

const CONFIRMED_BOOKING_KEY = 'cinematix_confirmed_booking';

/**
 * Normalisasi data booking dari backend agar kompatibel dengan tampilan frontend.
 *
 * Backend:  { userId, movieId, showtimeId, seats (ObjectId[]), totalPrice, status }
 * Frontend: { user, showtime: { movie, hall, show_date, start_time },
 *             selected_seats (string[]), total_amount }
 */
export const normalizeBooking = (booking) => {
  if (!booking) return booking;
  const showtime = booking.showtimeId || booking.showtime || null;
  const studio = showtime?.studioId || null;
  const bioskop = showtime?.bioskopId || null;
  const movie = booking.movieId || showtime?.movieId || showtime?.movie || null;

  return {
    ...booking,
    // Normalisasi seats: backend simpan ObjectId atau {_id, code}, ambil code-nya
    selected_seats: (booking.seats || []).map((s) =>
      typeof s === 'string' ? s : s.code || s._id
    ),
    total_amount: booking.totalPrice ?? booking.total_amount ?? 0,
    total_seats: (booking.seats || []).length,
    user: booking.userId
      ? {
          ...booking.userId,
          id: booking.userId._id || booking.userId.id,
          fullName: booking.userId.name || booking.userId.fullName,
        }
      : booking.user || null,
    // Normalisasi showtime agar struktur sesuai ekspektasi frontend
    showtime: showtime
      ? {
          ...showtime,
          movie,
          bioskop,
          cinema: bioskop,
          cinema_name:
            bioskop?.name ||
            showtime?.bioskop?.name ||
            showtime?.cinema_name ||
            showtime?.cinema ||
            '-',
          hall: {
            ...(typeof studio === 'object' && studio !== null ? studio : {}),
            hall_name:
              studio?.name ||
              showtime?.studio ||
              showtime?.hall?.hall_name ||
              'Studio',
            studioId: studio?._id || showtime?.studioId || null,
          },
          show_date: showtime?.date || showtime?.show_date || null,
          start_time: showtime?.startTime || showtime?.start_time || null,
          end_time: showtime?.endTime || showtime?.end_time || null,
        }
      : booking.showtime || null,
  };
};

export const bookingService = {
  /**
   * Mengambil kursi yang sudah dipesan untuk suatu showtime.
   * Mengembalikan array string kode kursi, mis. ["A1", "B2"]
   */
  async getSeatAvailability(showtimeId) {
    const { data } = await api.get(`/showtimes/showtimes/${showtimeId}/seats`);
    // data.bookedSeats = [{ _id, code }]
    return (data.bookedSeats || []).map((s) =>
      typeof s === 'string' ? s : s.code || s._id
    );
  },

  /**
   * Membuat booking baru (status: pending).
   * Input: { userId, movieId, showtimeId, seats: string[], totalAmount }
   */
  async createBooking(input) {
    const payload = {
      userId: input.user || input.userId,
      movieId: input.movieId,
      showtimeId: input.showtime || input.showtimeId,
      seats: input.selected_seats || input.seats || [],
    };
    const { data } = await api.post('/bookings', payload);
    if (!data.success) throw new Error(data.message || 'Gagal membuat booking');
    // Simpan booking ID untuk halaman konfirmasi
    sessionStorage.setItem(CONFIRMED_BOOKING_KEY, data.data._id);
    return normalizeBooking(data.data);
  },

  /**
   * Mengambil semua booking milik user yang sedang login.
   * Memanggil GET /api/bookings?userId=... karena backend belum punya
   * endpoint /api/bookings/user/:id yang terpisah.
   */
  async getMyBookings(userId) {
    // Backend saat ini mengembalikan semua booking tanpa filter user.
    // Kita filter di client menggunakan userId.
    const { data } = await api.get('/bookings');
    const all = (data.data || []).map(normalizeBooking);
    return all.filter(
      (b) =>
        b.userId?._id === userId ||
        b.userId === userId ||
        b.user?._id === userId ||
        b.user?.id === userId
    );
  },

  async getBookingById(id) {
    const { data } = await api.get(`/bookings/${id}`);
    if (!data.success) throw new Error('Booking tidak ditemukan');
    return normalizeBooking(data.data);
  },

  async cancelBooking(id) {
    const { data } = await api.put(`/bookings/${id}`, { status: 'cancelled' });
    if (!data.success) throw new Error(data.message || 'Gagal membatalkan booking');
    return normalizeBooking(data.data);
  },

  getConfirmedBookingId() {
    return sessionStorage.getItem(CONFIRMED_BOOKING_KEY);
  },

  clearConfirmedBookingId() {
    sessionStorage.removeItem(CONFIRMED_BOOKING_KEY);
  },
};
