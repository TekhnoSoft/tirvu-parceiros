import api from './api';

const partnerService = {
  list: async (status, startDate, endDate) => {
    const params = {};
    if (status) params.status = status;
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    const response = await api.get('/partners', { params });
    return response.data;
  },

  approve: async (id) => {
    const response = await api.put(`/partners/${id}/approve`);
    return response.data;
  },

  reject: async (id, reason) => {
    const response = await api.put(`/partners/${id}/reject`, { reason });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/partners/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/partners/profile', data);
    return response.data;
  }
};

export default partnerService;
