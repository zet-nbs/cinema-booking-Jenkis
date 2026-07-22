import api from "./api";

/**
 * Normalisasi data showtime dari backend agar kompatibel dengan struktur
 * yang diharapkan komponen frontend.
 *
 * Backend:  { movieId, bioskopId, date, startTime, studio, price, ... }
 * Frontend: { movie, hall: { hall_name }, show_date, start_time, ticket_price }
 */
const normalizeShowtime = (showtime) => {
  if (!showtime) return showtime;
  return {
    ...showtime,
    // Normalisasi field movie (bisa populate object atau plain)
    movie: showtime.movieId || showtime.movie || null,
    // Normalisasi field hall/studio agar komponen bisa pakai showtime.hall.hall_name
    hall: {
      _id: showtime.studioId?._id || showtime.studioId || null,
      hall_name: showtime.studioId?.name || showtime.studio || "Studio",
      total_seats: showtime.studioId?.totalSeats || showtime.totalSeats || 0,
      // Jangan gunakan layout 10×10 sebagai fallback. Bila studio tidak
      // ditemukan, frontend tidak boleh menawarkan kursi yang tidak ada.
      layout_rows: showtime.studioId?.rows ?? showtime.rows ?? 0,
      layout_columns:
        showtime.studioId?.seatsPerRow ?? showtime.seatsPerRow ?? 0,
    },
    // Normalisasi tanggal dan waktu
    show_date: showtime.date || showtime.show_date || null,
    start_time: showtime.startTime || showtime.start_time || null,
    end_time: showtime.endTime || showtime.end_time || null,
    ticket_price: showtime.price || showtime.ticket_price || 0,

    booked_seats: showtime.bookedSeats || [],
  };
};

export const showtimeService = {
  async getShowtimes(filters = {}) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.genre) params.genre = filters.genre;
    if (filters.date) params.date = filters.date;
    if (filters.location) params.location = filters.location;
    if (filters.bioskop) params.bioskop = filters.bioskop;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const { data } = await api.get("/showtimes", { params });
    const showtimes = (data.data || []).map(normalizeShowtime);

    // Filter movieId di client jika ada
    if (filters.movieId) {
      return showtimes.filter((s) => {
        const mid = s.movie?._id || s.movieId;
        return mid === filters.movieId;
      });
    }
    return showtimes;
  },

  async getShowtimeById(id) {
    const { data } = await api.get(`/showtimes/showtimes/${id}`);
    if (!data.success) throw new Error("Showtime tidak ditemukan");
    return normalizeShowtime(data.data);
  },

  async getMovieShowtimes(movieId) {
    const { data } = await api.get(`/showtimes/movies/${movieId}/showtimes`);
    const showtimes = (data.data || []).map(normalizeShowtime);
    return showtimes;
  },

  // ====== ADMIN: Studio (menggantikan getHalls) ======

  async getHalls() {
    const { data } = await api.get("/studios");
    return (data.data || []).map((studio) => ({
      ...studio,
      _id: studio._id,
      hall_name: studio.name,
      capacity: studio.totalSeats,
      total_seats: studio.totalSeats,
      layout_rows: studio.rows,
      layout_columns: studio.seatsPerRow,
    }));
  },

  async createHall(hallData) {
    const payload = {
      name: hallData.hall_name || hallData.name,
      studioId: hallData.studioId || `STD-${Date.now()}`,
      totalSeats: hallData.total_seats || hallData.capacity,
      rows: hallData.layout_rows || hallData.rows,
      seatsPerRow: hallData.layout_columns || hallData.seatsPerRow,
      cinema: hallData.cinema || hallData.bioskopId,
    };
    const { data } = await api.post("/studios", payload);
    if (!data.success) throw new Error(data.message || "Gagal membuat studio");
    return { ...data.data, hall_name: data.data.name };
  },

  async updateHall(id, hallData) {
    const payload = {
      name: hallData.hall_name || hallData.name,
      totalSeats: hallData.total_seats || hallData.capacity,
      rows: hallData.layout_rows || hallData.rows,
      seatsPerRow: hallData.layout_columns || hallData.seatsPerRow,
    };
    const { data } = await api.put(`/studios/${id}`, payload);
    if (!data.success)
      throw new Error(data.message || "Gagal mengupdate studio");
    return { ...data.data, hall_name: data.data.name };
  },

  async deleteHall(id) {
    const { data } = await api.delete(`/studios/${id}`);
    if (!data.success)
      throw new Error(data.message || "Gagal menghapus studio");
  },

  // ====== ADMIN: Showtime CRUD ======

  async createShowtime(showtimeData) {
    // Normalisasi field dari frontend ke format backend
    const payload = {
      movieId: showtimeData.movie || showtimeData.movieId,
      bioskopId: showtimeData.bioskopId,
      date: showtimeData.show_date || showtimeData.date,
      startTime: showtimeData.start_time || showtimeData.startTime,
      endTime: showtimeData.end_time || showtimeData.endTime, // 👈 TAMBAHKAN BARIS INI
      studioId: showtimeData.hallId || showtimeData.studioId,
      studio:
        showtimeData.hallName ||
        showtimeData.hall?.hall_name ||
        showtimeData.studio,
      price: showtimeData.ticket_price || showtimeData.price,
    };
    const { data } = await api.post("/showtimes/showtimes", payload);
    if (!data.success)
      throw new Error(data.message || "Gagal membuat showtime");
    return normalizeShowtime(data.data);
  },

  async updateShowtime(id, showtimeData) {
    const payload = {
      movieId: showtimeData.movie || showtimeData.movieId,
      bioskopId: showtimeData.bioskopId,
      date: showtimeData.show_date || showtimeData.date,
      startTime: showtimeData.start_time || showtimeData.startTime,
      endTime: showtimeData.end_time || showtimeData.endTime, // 👈 TAMBAHKAN BARIS INI
      studioId: showtimeData.hallId || showtimeData.studioId,
      studio:
        showtimeData.hallName ||
        showtimeData.hall?.hall_name ||
        showtimeData.studio,
      price: showtimeData.ticket_price || showtimeData.price,
    };
    const { data } = await api.put(`/showtimes/showtimes/${id}`, payload);
    if (!data.success)
      throw new Error(data.message || "Gagal mengupdate showtime");
    return normalizeShowtime(data.data);
  },

  async deleteShowtime(id) {
    const { data } = await api.delete(`/showtimes/showtimes/${id}`);
    if (!data.success)
      throw new Error(data.message || "Gagal menghapus showtime");
  },
};
