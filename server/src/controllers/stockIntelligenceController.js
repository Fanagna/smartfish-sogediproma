const prisma = require('../config/database');
const { askGemini } = require('../services/iaService');
const { detectRuptureImminente, detectSurstock, getAnalyseRentabilite, getRotationIntelligente, getProduitsCritiques } = require('../services/stockIntelligenceService');

const getRupture = async (req, res, next) => {
  try {
    const ruptureData = await detectRuptureImminente();
    res.json({ rupture: ruptureData });
  } catch (error) {
    next(error);
  }
};

const getSurstock = async (req, res, next) => {
  try {
    const surstockData = await detectSurstock();
    res.json({ surstock: surstockData });
  } catch (error) {
    next(error);
  }
};

const getRecommendation = async (req, res, next) => {
  try {
    const [rupture, surstock, rentabilite, stocks] = await Promise.all([
      detectRuptureImminente(),
      detectSurstock(),
      getAnalyseRentabilite(),
      prisma.stock.findMany({ where: { dateSortie: null }, include: { bateau: true } })
    ]);

    const promptSystem = `Tu es un expert en gestion de stock (IA) pour une flotte de pêche SmartFish. Analyse les données fournies et génère des recommandations stratégiques :
- Pour chaque rupture imminente : recommande une quantité d'achat, urgence, et priorité
- Pour chaque surstock : recommande action (promotion, arrêter achat, etc.)
- Analyse rentabilité par espèce pour prioriser l'achat massif des espèces les plus rentables

Structure JSON attendue :
{
  "recommandationsRupture": [
    {
      "espece": "nom",
      "quantiteRecommandee": 100,
      "urgence": "HAUTE",
      "priorite": 1,
      "raison": "texte"
    }
  ],
  "recommandationsSurstock": [
    {
      "espece": "nom",
      "action": "texte",
      "raison": "texte"
    }
  ],
  "recommandationsAchatMassif": [
    {
      "espece": "nom",
      "quantiteSuggestionnee": 200,
      "raison": "texte"
    }
  ],
  "analyseRentabilite": [
    {
      "espece": "nom",
      "totalCA": 1500,
      "prixMoyenUnitaire": 12.5,
      "rentabilite": "HAUTE"
    }
  ]
}`;

    const result = await askGemini(promptSystem, { rupture, surstock, rentabilite, stocks }, 'STOCK_INTELLIGENCE');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getRotation = async (req, res, next) => {
  try {
    const rotationData = await getRotationIntelligente();
    res.json({ rotation: rotationData });
  } catch (error) {
    next(error);
  }
};

const getCritiques = async (req, res, next) => {
  try {
    const critiques = await getProduitsCritiques();
    res.json(critiques);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRupture,
  getSurstock,
  getRecommendation,
  getRotation,
  getCritiques
};
