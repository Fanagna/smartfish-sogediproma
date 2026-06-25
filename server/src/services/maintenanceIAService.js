const prisma = require('../config/database');
const { askGemini } = require('./iaService');
const logger = require('../utils/logger');

const predireMaintenance = async () => {
  try {
    logger.info('Prédiction maintenance en cours...');

    const [bateaux, maintenanceRecords] = await Promise.all([
      prisma.bateau.findMany(),
      prisma.maintenance.findMany({ take: 100, orderBy: { date: 'desc' }, include: { bateau: true } })
    ]);

    const promptSystem = `Tu es un expert en maintenance de bateaux de pêche. En analysant les données des bateaux et l'historique de maintenance, prédis pour chaque bateau la prochaine maintenance nécessaire.
Retourne un JSON avec une liste de prédictions. Chaque prédiction doit inclure:
- bateauId: ID du bateau
- type: Type de maintenance (MOTEUR, HYDRAULIQUE, COQUE, ELECTRONIQUE, AUTRE)
- dateEstimee: Date estimée au format YYYY-MM-DD
- priorite: BASSE, MOYENNE, HAUTE
- raison: Justification

Structure JSON attendue:
{
  "predictions": [
    { "bateauId": 1, "type": "MOTEUR", "dateEstimee": "2024-12-15", "priorite": "HAUTE", "raison": "texte" }
  ]
}`;

    const result = await askGemini(promptSystem, { bateaux, maintenanceRecords }, 'MAINTENANCE_PREDICTION');

    logger.info(`${result.predictions.length} prédictions de maintenance générées`);
    return result.predictions;
  } catch (error) {
    logger.error('Erreur lors de la prédiction maintenance:', error);
    throw error;
  }
};

module.exports = { predireMaintenance };
