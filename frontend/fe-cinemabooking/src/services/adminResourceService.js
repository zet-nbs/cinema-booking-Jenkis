import api from './api';

const unwrap = (data) => data.data ?? data;

export const adminResourceService = {
  async list(endpoint) {
    const { data } = await api.get(endpoint);
    return unwrap(data) || [];
  },
  async create(endpoint, payload) {
    const { data } = await api.post(endpoint, payload);
    return unwrap(data);
  },
  async update(endpoint, id, payload) {
    const { data } = await api.put(`${endpoint}/${id}`, payload);
    return unwrap(data);
  },
  async remove(endpoint, id) {
    await api.delete(`${endpoint}/${id}`);
  },
};
