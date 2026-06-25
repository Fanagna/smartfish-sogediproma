/**
 * IA Chat Controller
 * 
 * Regroupe les endpoints conversationnels : assistant chat, recommandations, optimisation flotte, stratégique.
 * Utilise le cache mutualisé iaContextService.
 */

const prisma = require('../config/database');
const { askGemini } = require('../services/iaService');
const ctx = require('../services/iaContextService');

// ─── IA2 (IA15) — Assistant conversationnel exécutif ───
const chatAssistant = async (req, res, next) => {
  try {
    const { question, history } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question requise' });
    }

    // Récupérer les KPI pour le contexte
    const { captures, stocks, bateaux, maintenances, ventes, exportations, anomalies } = await ctx.getFullContext();
    const stats30j = await ctx.getStats30j();

    const totalStock = stocks.reduce((sum, s) => sum + s.quantite, 0);
    const totalVentes = ventes.reduce((sum, v) => sum + v.total, 0);
    const totalAnomaliesActives = anomalies.filter(a => a.statut === 'EN_ATTENTE').length;
    const totalBateaux = bateaux.length;

    const kpiContext = {
      totalCaptures30j: stats30j._count._all,
      totalPoids30j: stats30j._sum.poids,
      totalQuantite30j: stats30j._sum.quantite,
      stockTotal: totalStock,
      caVentes30j: totalVentes,
      nbAnomaliesActives: totalAnomaliesActives,
      nbBateauxActifs: totalBateaux,
    };

    const promptSystem = `Tu es un assistant exécutif conversationnel (IA15) pour la flotte de pêche SmartFish. Tu as accès à TOUTES les données de l'entreprise, y compris les dernières KPI et l'historique de conversation fourni.
Réponds à la question de l'utilisateur en français de façon claire, professionnelle et conviviale. Utilise les données fournies pour être précis.
Si utile, formate les informations en tableaux Markdown. Si tu n'as pas les données pour répondre, dis-le poliment.

Structure JSON attendue pour ta réponse:
{
  "reponse": "texte en français"
}`;

    const result = await askGemini(promptSystem, {
      question,
      history,
      kpiContext,
      captures,
      stocks,
      bateaux,
      maintenances,
      ventes,
      exportations,
      anomalies,
    }, 'CHAT_IA15');

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── Recommandations globales ───
const getRecommandations = async (req, res, next) => {
  try {
    const { captures, stocks, maintenances } = await ctx.getFullContext();

    const promptSystem = `Tu es un conseiller en gestion de flotte de pêche. Donne 5 recommandations globales pour optimiser les opérations:
- Conservation des stocks
- Maintenance des bateaux
- Choix des zones de pêche
- Gestion du carburant
- Optimisation des captures

Structure JSON attendue:
{
  "recommandations": [
    { "categorie": "texte", "titre": "texte", "contenu": "texte", "priorite": "haute|moyenne|basse" }
  ]
}`;

    const result = await askGemini(promptSystem, { captures, stocks, maintenance: maintenances }, 'RECOMMANDATION');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── IA8 — Optimisation de la flotte ───
const optimizeFleet = async (req, res, next) => {
  try {
    const { bateaux, captures, stocks, maintenances } = await ctx.getFleetContext();

    const promptSystem = `Tu es un optimiseur de flotte de pêche (IA8). En analysant les données des bateaux, captures, stocks et maintenances:
- Recommande quel bateau envoyer en mer en priorité (avec raison)
- Propose une répartition optimale des zones de pêche
- Donne des conseils sur la gestion des équipages

Structure JSON attendue:
{
  "priorisationBateaux": [
    { "bateauId": 1, "nom": "nom", "recommandation": "texte", "priorite": 1 }
  ],
  "repartitionZones": [
    { "bateauId": 1, "zonePeche": "texte", "especeCible": "texte", "justification": "texte" }
  ],
  "conseilsEquipages": [
    "texte"
  ],
  "recommandationsCarburant": [
    "texte"
  ]
}`;

    const result = await askGemini(promptSystem, { bateaux, captures, stocks, maintenances }, 'FLEET_OPTIMIZATION');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── IA14 — Recommandations stratégiques (DG) ───
const getStrategicRecommendations = async (req, res, next) => {
  try {
    const data = await ctx.getFullContext();
    const { captures, stocks, bateaux, maintenances, ventes, exportations, anomalies } = data;

    const promptSystem = `Tu es un conseiller stratégique pour le Directeur Général de SmartFish (IA14). Analyse toutes les données historiques et actuelles pour produire des recommandations stratégiques à long terme (3-12 mois):
- Développement de la flotte
- Expansion géographique
- Diversification des espèces
- Investissements technologiques
- Optimisation financière
- Gestion des risques

Structure JSON attendue:
{
  "recommandationsStrategiques": [
    { "titre": "texte", "description": "texte", "impact": "faible|moyen|élevé", "delai": "court|moyen|long", "coutEstime": "texte" }
  ],
  "scenariosFuturs": [
    { "titre": "texte", "description": "texte", "probabilite": "faible|moyenne|élevée", "impact": "texte" }
  ],
  "prioritesDG": [
    "texte"
  ]
}`;

    const result = await askGemini(promptSystem, data, 'STRATEGIC_RECOMMENDATIONS');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatAssistant,
  getRecommandations,
  optimizeFleet,
  getStrategicRecommendations,
};
