const axios = require('axios');
const logger = require('../utils/logger');

const sendWhatsAppAlert = async (alertData) => {
  try {
    const apiUrl = process.env.WHATSAPP_API_URL;

    if (!apiUrl) {
      logger.warn('WHATSAPP_API_URL non configurée, alerte non envoyée. Données:', alertData);
      return;
    }

    const message = `[ALERTE SMARTFISH]
Type: ${alertData.type}
Urgence: ${alertData.urgence}
Date: ${new Date().toLocaleString('fr-FR')}
Description: ${alertData.description}`;

    logger.info(`Préparation d'envoi d'alerte WhatsApp: ${message}`);
    logger.info(`API URL configurée: ${apiUrl}`);

    const response = await axios.post(apiUrl, {
      message,
      alertId: alertData.id
    });

    logger.info('Alerte WhatsApp envoyée avec succès:', response.data);
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'alerte WhatsApp:', error.message);
  }
};

module.exports = { sendWhatsAppAlert };
