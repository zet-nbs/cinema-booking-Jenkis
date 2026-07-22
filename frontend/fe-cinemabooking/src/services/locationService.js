import api from "./api"; // Sesuaikan dengan instance axios/fetch kamu

export const locationService = {
  getLocations: async () => {
    try {
      const response = await api.get("/locations");
      // Jika API kamu me-return array langsung, gunakan response.data
      // Jika dibungkus object { data: [...] }, gunakan response.data.data
      return response.data;
    } catch (error) {
      console.error("Error fetching locations:", error);
      throw error;
    }
  },
};
