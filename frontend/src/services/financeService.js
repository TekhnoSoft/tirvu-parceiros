import api from './api';

const financeService = {
  getMovements: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/finance/movements?${params}`);
    return response.data;
  },

  getProof: async (leadId) => {
    const response = await api.get(`/finance/proof/${leadId}`);
    return response.data;
  }
};

export default financeService;
