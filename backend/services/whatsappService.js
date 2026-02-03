const axios = require('axios');

class WhatsappService {
  constructor() {
    this.instance = process.env.ZAPI_INSTANCE;
    this.token = process.env.ZAPI_TOKEN;
    this.clientToken = process.env.ZAPI_CLIENT_TOKEN;
    this.baseUrl = `https://api.z-api.io/instances/${this.instance}/token/${this.token}`;
  }

  async sendText(phone, message) {
    try {
      // Formatar telefone: remover caracteres não numéricos e garantir 55
      let cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone.startsWith('55')) {
        cleanPhone = '55' + cleanPhone;
      }

      const url = `${this.baseUrl}/send-text`;
      const config = {
        headers: {
          'Client-Token': this.clientToken,
          'Content-Type': 'application/json'
        }
      };

      const data = {
        phone: cleanPhone,
        message: message
      };

      console.log(`Sending WhatsApp message to ${cleanPhone}...`);
      const response = await axios.post(url, data, config);
      console.log('WhatsApp message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      // Não lançar erro para não bloquear o fluxo principal, apenas logar
      return null;
    }
  }

  async sendFile(phone, base64Data, caption = '') {
    try {
      // Formatar telefone
      let cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone.startsWith('55')) {
        cleanPhone = '55' + cleanPhone;
      }

      // Detectar extensão e mime type
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let extension = 'pdf'; // default
      
      if (matches && matches.length >= 2) {
          const mime = matches[1];
          extension = mime.split('/')[1];
          // Correções comuns de extensão
          if (extension === 'jpeg') extension = 'jpg';
          if (extension === 'plain') extension = 'txt';
          if (extension === 'msword') extension = 'doc';
          if (extension === 'vnd.openxmlformats-officedocument.wordprocessingml.document') extension = 'docx';
      }

      // Usar endpoint send-document/{extension}
      const url = `${this.baseUrl}/send-document/${extension}`;
      
      const config = {
        headers: {
          'Client-Token': this.clientToken,
          'Content-Type': 'application/json'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      };
      
      const data = {
        phone: cleanPhone,
        document: base64Data, // Enviar string completa com prefixo data:...
        fileName: `comprovante.${extension}`
        // caption removido pois send-document pode não suportar
      };

      console.log(`Sending WhatsApp file to ${cleanPhone} via ${url}...`);
      
      const response = await axios.post(url, data, config);
      
      // Check for soft errors
      if (response.data && (response.data.error || response.data.status === 'error')) {
          throw { 
              response: { 
                  status: 400, 
                  data: response.data 
              },
              message: response.data.message || response.data.error
          };
      }

      console.log('WhatsApp file sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp file:', error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = new WhatsappService();
