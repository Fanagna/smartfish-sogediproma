const cron = require('node-cron');
const { detecterAnomalies } = require('./anomalieService');
const { getProduitsCritiques } = require('./stockIntelligenceService');
const { sendWhatsAppAlert } = require('./whatsappService');
const { notifyByRole } = require('./notificationService');
const logger = require('../utils/logger');
const prisma = require('../config/database');

let anomalyCronJob;
let stockCronJob;

const verifierStocksCritiques = async () => {
  logger.info('=== Début de la vérification des stocks critiques ===');
  try {
    const critiques = await getProduitsCritiques();
    
    // Récupérer un utilisateur admin pour lier les alertes
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    // Envoyer des alertes pour les ruptures critiques
    for (const rupture of critiques.ruptureImminente) {
      const alertData = {
        id: rupture.stockId,
        type: 'RUPTURE STOCK',
        urgence: rupture.niveauUrgence,
        description: `Rupture imminente pour ${rupture.espece} (${rupture.quantiteActuelle} restants, ~${rupture.joursRestants} jours)`
      };
      
      logger.warn('Stock critique détecté:', alertData);
      await sendWhatsAppAlert(alertData);
      // 🔔 Notification in-app
      await notifyByRole(
        ['ADMIN', 'CAPITAINE'],
        `🚨 Rupture imminente: ${rupture.espece} — ${rupture.quantiteActuelle} ${rupture.unite || 'kg'} restants, ~${rupture.joursRestants} jours`,
        'error',
        '/stocks'
      );
    }

    // Envoyer des alertes pour les surstocks dangereux
    for (const surstock of critiques.surstockDangereux) {
      const alertData = {
        id: surstock.stockId,
        type: 'SURSTOCK',
        urgence: 'HAUTE',
        description: `Surstock dangereux pour ${surstock.espece} (${surstock.quantiteActuelle} ${surstock.unite}, ratio ${surstock.ratio})`
      };
      
      logger.warn('Surstock détecté:', alertData);
      await sendWhatsAppAlert(alertData);
    }

    logger.info(`Vérification stocks terminée: ${critiques.totalCritiques} produits critiques trouvés`);
  } catch (error) {
    logger.error('Erreur dans la vérification des stocks:', error);
  }
  logger.info('=== Fin de la vérification des stocks critiques ===');
};

const startCronJobs = () => {
  if (anomalyCronJob || stockCronJob) {
    logger.warn('Certains cron jobs sont déjà démarrés');
  }

  // Job de détection d'anomalies (toutes les 15 minutes)
  anomalyCronJob = cron.schedule('*/15 * * * *', async () => {
    logger.info('=== Début du cron job de détection d\'anomalies ===');
    try {
      await detecterAnomalies();
    } catch (error) {
      logger.error('Erreur dans le cron job d\'anomalies:', error);
    }
    logger.info('=== Fin du cron job de détection d\'anomalies ===');
  });

  // Job de vérification des stocks critiques (toutes les heures)
  stockCronJob = cron.schedule('0 * * * *', async () => {
    await verifierStocksCritiques();
  });

  logger.info('Cron jobs démarrés: anomalies (15min), stocks (1h)');
};

const stopCronJobs = () => {
  if (anomalyCronJob) {
    anomalyCronJob.stop();
    anomalyCronJob = null;
  }
  if (stockCronJob) {
    stockCronJob.stop();
    stockCronJob = null;
  }
  logger.info('Tous les cron jobs arrêtés');
};

module.exports = { startCronJobs, stopCronJobs };
