/**
 * IA Analysis Controller
 * 
 * Regroupe les endpoints d'analyse : analyse globale, anomalies, fraude, risques, génération de rapports.
 * Utilise le cache mutualisé iaContextService.
 */

const prisma = require('../config/database');
const { askGemini } = require('../services/iaService');
const ctx = require('../services/iaContextService');

// ─── IA1 — Analyse globale ───
const getGlobalAnalysis = async (req, res, next) => {
  try {
    const data = await ctx.getFullContext();
    const { captures, stocks, bateaux, maintenances, ventes, exportations, anomalies } = data;

    const promptSystem = `Tu es un analyseur intelligent global de flotte de pêche (IA1). Analyse TOUTES les données fournies (captures, stocks, bateaux, maintenances, ventes, exportations, anomalies) et produit des insights clairs et actionnables:
- KPI clés et tendances globales
- Points forts de l'entreprise
- Risques et opportunités
- Recommandations immédiates

Structure JSON attendue:
{
  "kpiCles": {
    "totalCaptures30j": 0,
    "stockTotal": 0,
    "caVentes30j": 0,
    "nbAnomaliesActives": 0,
    "nbBateauxActifs": 0
  },
  "tendances": [
    { "type": "texte", "description": "texte", "tendance": "positive|negative|neutre" }
  ],
  "pointsForts": [
    "texte"
  ],
  "risques": [
    { "description": "texte", "niveau": "basse|moyenne|haute|critique" }
  ],
  "opportunites": [
    "texte"
  ],
  "recommandationsImmediates": [
    { "titre": "texte", "description": "texte", "priorite": "haute|moyenne|basse" }
  ]
}`;

    const result = await askGemini(promptSystem, data, 'GLOBAL_ANALYSIS');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── Liste des anomalies (CRUD) ───
const getAnomalies = async (req, res, next) => {
  try {
    const anomalies = await prisma.anomalie.findMany({
      include: { user: { select: { id: true, nom: true, prenom: true } } },
    });
    res.json(anomalies);
  } catch (error) {
    next(error);
  }
};

// ─── Détection d'anomalies via Gemini ───
const checkAnomalies = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { captures, stocks, bateaux } = await ctx.getFullContext();

    const promptSystem = `Tu es un expert en détection d'anomalies dans la pêche. Analyse les données et détecte les anomalies potentielles:
- Chute soudaine des captures
- Stock critique
- Maintenance urgente non effectuée
- Autres anomalies

Structure JSON attendue:
{
  "anomalies": [
    { "description": "texte", "type": "texte", "urgence": "basse|moyenne|haute|critique" }
  ]
}`;

    const result = await askGemini(promptSystem, { captures, stocks, bateaux }, 'ANOMALIE');

    const anomaliesCreees = [];
    for (const anom of result.anomalies) {
      const nouvelleAnomalie = await prisma.anomalie.create({
        data: {
          userId,
          description: anom.description,
          type: anom.type,
          urgence: anom.urgence.toUpperCase(),
          statut: 'EN_ATTENTE',
        },
      });
      anomaliesCreees.push(nouvelleAnomalie);
    }

    res.json(anomaliesCreees);
  } catch (error) {
    next(error);
  }
};

// ─── IA9 — Détection d'anomalies opérationnelles ───
const detectOperationalAnomalies = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { captures, stocks, bateaux, maintenances } = await ctx.getFullContext();

    const promptSystem = `Tu es un détecteur d'anomalies opérationnelles (IA9) pour flotte de pêche. Analyse les données et détecte tous les anomalies:
- Déclaration incohérente sur captures (poids/quantité/zone)
- Écarts de stock soudains
- Bateau avec maintenance overdue
- Niveau carburant critique
- Anomalie température/profondeur

Pour chaque anomalie, propose un niveau d'urgence. Enregistre automatiquement les anomalies en DB.

Structure JSON attendue:
{
  "anomaliesDetectees": [
    { 
      "description": "texte", 
      "type": "texte", 
      "urgence": "BASSE|MOYENNE|HAUTE|CRITIQUE", 
      "details": "texte" 
    }
  ]
}`;

    const result = await askGemini(promptSystem, { captures, stocks, bateaux, maintenances }, 'OPERATIONAL_ANOMALIES');

    const anomalies = [];
    for (const anom of result.anomaliesDetectees) {
      const created = await prisma.anomalie.create({
        data: {
          userId,
          description: anom.description,
          type: anom.type,
          urgence: anom.urgence.toUpperCase(),
          statut: 'EN_ATTENTE',
        },
      });
      anomalies.push(created);
    }

    res.json({ anomalies, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── IA10 — Détection de fraude ───
const detectFraud = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { captures, stocks, ventes, exportations } = await ctx.getFullContext();

    const promptSystem = `Tu es un détecteur de fraude (IA10) pour flotte de pêche. Analyse les données pour détecter:
- Déclarations incohérentes entre captures et stocks
- Écarts de stock importants non justifiés
- Transactions suspectes (ventes/exportations)
- Falsification possible de données

Pour chaque fraude détectée, détermine le niveau de risque.

Structure JSON attendue:
{
  "fraudesDetectees": [
    { 
      "description": "texte", 
      "type": "declaration_incoherente|ecart_stock|transaction_suspecte", 
      "niveauRisque": "faible|moyen|eleve|critique", 
      "donneesConcernees": "texte" 
    }
  ]
}`;

    const result = await askGemini(promptSystem, { captures, stocks, ventes, exportations }, 'FRAUD_DETECTION');

    const fraudes = [];
    for (const fraude of result.fraudesDetectees) {
      const created = await prisma.fraude.create({
        data: {
          userId,
          description: fraude.description,
          type: fraude.type,
          niveauRisque: fraude.niveauRisque,
          statut: 'en_attente',
          donneesConcernees: fraude.donneesConcernees,
        },
      });
      fraudes.push(created);
    }

    res.json({ fraudes, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── IA12 — Analyse des risques ───
const analyzeRisks = async (req, res, next) => {
  try {
    const data = await ctx.getFullContext();
    const { captures, stocks, bateaux, maintenances, ventes, exportations } = data;
    const anomalies = await prisma.anomalie.findMany({ where: { statut: 'EN_ATTENTE' } });

    const promptSystem = `Tu es un analyseur de risques (IA12) pour flotte de pêche. Évalue les risques dans 3 domaines:
1. Financier: rentabilité, stocks, coûts maintenance
2. Opérationnel: panne bateau, rupture stock, conditions météo (si données disponibles)
3. Logistique: approvisionnement, livraisons export

Pour chaque risque, indique probabilité, impact et recommandations.

Structure JSON attendue:
{
  "risquesFinanciers": [
    { "titre": "texte", "description": "texte", "probabilite": "faible|moyenne|élevée", "impact": "faible|moyen|élevé|critique", "recommandation": "texte" }
  ],
  "risquesOperationnels": [
    { "titre": "texte", "description": "texte", "probabilite": "faible|moyenne|élevée", "impact": "faible|moyen|élevé|critique", "recommandation": "texte" }
  ],
  "risquesLogistiques": [
    { "titre": "texte", "description": "texte", "probabilite": "faible|moyenne|élevée", "impact": "faible|moyen|élevé|critique", "recommandation": "texte" }
  ],
  "recommandationsGlobales": [
    "texte"
  ]
}`;

    const result = await askGemini(promptSystem, { captures, stocks, bateaux, maintenances, ventes, exportations, anomalies }, 'RISK_ANALYSIS');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── IA13 — Génération de rapports ───
const generateReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query; // journalier, hebdomadaire, mensuel
    if (!type) return res.status(400).json({ error: 'type required' });

    const now = new Date();
    let dateDebut;
    let titre;

    if (type === 'journalier') {
      dateDebut = new Date(now.setHours(0, 0, 0, 0));
      titre = 'Rapport journalier';
    } else if (type === 'hebdomadaire') {
      dateDebut = new Date(now);
      dateDebut.setDate(now.getDate() - 7);
      titre = 'Rapport hebdomadaire';
    } else if (type === 'mensuel') {
      dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
      titre = 'Rapport mensuel';
    } else {
      return res.status(400).json({ error: 'invalid type' });
    }

    const [captures, stocks, bateaux, maintenances, ventes, exportations, anomalies] = await Promise.all([
      prisma.capture.findMany({ where: { date: { gte: dateDebut } } }),
      prisma.stock.findMany({ where: { dateSortie: null } }),
      prisma.bateau.findMany(),
      prisma.maintenance.findMany({ where: { date: { gte: dateDebut } } }),
      prisma.vente.findMany({ where: { date: { gte: dateDebut } } }),
      prisma.exportation.findMany({ where: { date: { gte: dateDebut } } }),
      prisma.anomalie.findMany({ where: { date: { gte: dateDebut } } }),
    ]);

    const promptSystem = `Tu es un générateur de rapports (IA13) pour SmartFish. Crée un rapport détaillé ${type} avec:
- Résumé exécutif
- KPIs clés
- Analyse des captures
- État des stocks
- État de la flotte
- Ventes et exportations
- Anomalies et risques
- Recommandations

Structure JSON attendue:
{
  "titre": "texte",
  "contenu": "texte (format Markdown)"
}`;

    const result = await askGemini(promptSystem, { type, captures, stocks, bateaux, maintenances, ventes, exportations, anomalies }, 'REPORT_GENERATION');

    const rapport = await prisma.rapport.create({
      data: {
        userId,
        type,
        titre,
        contenu: result.contenu,
        dateDebut,
        dateFin: new Date(),
      },
    });

    res.json({ rapport, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGlobalAnalysis,
  getAnomalies,
  checkAnomalies,
  detectOperationalAnomalies,
  detectFraud,
  analyzeRisks,
  generateReport,
};
