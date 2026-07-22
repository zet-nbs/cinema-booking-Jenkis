import api from "./api";

export const bioskopService = {
  getBioskops: async () => {
    try {
      const response = await api.get("/bioskop");
      return response.data;
    } catch (error) {
      console.error("Error fetching bioskops:", error);
      throw error;
    }
  },
};
