import api from './api';

const leadService = {
  list: async (filters = {}) => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.partnerId) params.partnerId = filters.partnerId;

    const response = await api.get('/leads', { params });
    return response.data;
  },

  create: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response.data;
  },

  update: async (id, data) => {
    // Check if data contains a file (FormData)
    // Removed FormData logic as we are now sending Base64 strings
    
    // Regular JSON update
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/leads/${id}`);
  },

  getNotes: async (id) => {
    const response = await api.get(`/leads/${id}/notes`);
    return response.data;
  },

  addNote: async (id, content) => {
    const response = await api.post(`/leads/${id}/notes`, { content });
    return response.data;
  },

  getTasks: async (id) => {
    const response = await api.get(`/leads/${id}/tasks`);
    return response.data;
  },

  addTask: async (id, taskData) => {
    const response = await api.post(`/leads/${id}/tasks`, taskData);
    return response.data;
  },

  deleteTask: async (id, taskId) => {
    await api.delete(`/leads/${id}/tasks/${taskId}`);
  }
};

export default leadService;
