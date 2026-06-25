const prisma = require('../config/database');
const { askGemini } = require('./iaService');
const { sendWhatsAppAlert } = require('./whatsappService');
const logger = require('../utils/logger');

const detecterAnomalies = async () => {
  try {
    logger.info('Détection automatique des anomalies en cours...');

    const [captures, stocks, bateaux] = await Promise.all([
      prisma.capture.findMany({ take: 50, orderBy: { date: 'desc' } }),
      prisma.stock.findMany({ where: { dateSortie: null } }),
      prisma.bateau.findMany()
    ]);

    const promptSystem = `Tu es un expert en détection d'anomalies dans la pêche maritime. Analyse les données et détecte les anomalies potentielles.
Retourne un JSON avec une liste d'anomalies, chaque anomalie doit contenir:
- description: description courte de l'anomalie
- type: type d'anomalie (CAPTURE, STOCK, MAINTENANCE, AUTRE)
- urgence: BASSE, MOYENNE, HAUTE, CRITIQUE
- details: informations supplémentaires

Structure JSON attendue:
{
  "anomalies": [
    { "description": "texte", "type": "CAPTURE", "urgence": "HAUTE", "details": "texte" }
  ]
}`;

    const result = await askGemini(promptSystem, { captures, stocks, bateaux }, 'ANOMALIE_DETECTION');

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (!adminUser) {
      logger.error('Aucun administrateur trouvé pour enregistrer les anomalies');
      return;
    }

    const anomaliesCreees = [];
    for (const anom of result.anomalies) {
      const nouvelleAnomalie = await prisma.anomalie.create({
        data: {
          userId: adminUser.id,
          description: anom.description,
          type: anom.type,
          urgence: anom.urgence.toUpperCase(),
          statut: 'EN_ATTENTE'
        }
      });
      anomaliesCreees.push(nouvelleAnomalie);

      if (nouvelleAnomalie.urgence === 'CRITIQUE') {
        logger.warn(`Anomalie critique détectée: ${nouvelleAnomalie.description}`);
        await sendWhatsAppAlert(nouvelleAnomalie);
      }
    }

    logger.info(`${anomaliesCreees.length} anomalies détectées et enregistrées`);
    return anomaliesCreees;
  } catch (error) {
    logger.error('Erreur lors de la détection des anomalies:', error);
    throw error;
  }
};

module.exports = { detecterAnomalies };
