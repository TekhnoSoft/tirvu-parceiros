import api from './api';

const chatService = {
  getContacts: async () => {
    const response = await api.get('/chat/contacts');
    return response.data;
  },

  getMessages: async (contactId) => {
    const response = await api.get(`/chat/messages/${contactId}`);
    return response.data;
  }
};

export default chatService;
