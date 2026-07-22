import api from "./api"; // Sesuaikan dengan instance axios/fetch kamu

export const hallService = {
  async getHalls() {
    const { data } = await api.get("/studios");
    return (data.data || []).map((studio) => ({
      ...studio,
      _id: studio._id,
      hall_name: studio.name,
      studioId: studio.studioId, // Tambahan field
      status: studio.status, // Tambahan field
      cinema: studio.cinema, // Tambahan field
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
      status: hallData.status || "active", // Tambahan field
      cinema: hallData.cinema || hallData.bioskopId, // Tambahan field
    };
    const { data } = await api.post("/studios", payload);
    if (!data.success) throw new Error(data.message || "Gagal membuat studio");
    return { ...data.data, hall_name: data.data.name };
  },

  async updateHall(id, hallData) {
    const payload = {
      name: hallData.hall_name || hallData.name,
      studioId: hallData.studioId, // Memungkinkan update custom studioId
      totalSeats: hallData.total_seats || hallData.capacity,
      rows: hallData.layout_rows || hallData.rows,
      seatsPerRow: hallData.layout_columns || hallData.seatsPerRow,
      status: hallData.status, // Tambahan field
      cinema: hallData.cinema, // Tambahan field
    };
    const { data } = await api.put(`/studios/${id}`, payload);
    if (!data.success)
      throw new Error(data.message || "Gagal mengupdate studio");
    return { ...data.data, hall_name: data.data.name };
  },
};
