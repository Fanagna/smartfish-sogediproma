const express = require('express');

// Contrôleurs découpés par domaine
const {
  getPredictions,
  getZones,
  predictMaintenance,
  predictSales,
  predictExports,
  getDashboardPredictif,
} = require('../controllers/iaPredictionsController');

const {
  getGlobalAnalysis,
  getAnomalies,
  checkAnomalies,
  detectOperationalAnomalies,
  detectFraud,
  analyzeRisks,
  generateReport,
} = require('../controllers/iaAnalysisController');

const {
  chatAssistant,
  getRecommandations,
  optimizeFleet,
  getStrategicRecommendations,
} = require('../controllers/iaChatController');

const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Dashboard IA Prédictif (marché, zones, recommandations) ───
router.get('/dashboard-predictif', authenticateToken, getDashboardPredictif);

// ─── Autres prédictions ───
router.get('/predictions', authenticateToken, getPredictions);
router.get('/zones', authenticateToken, getZones);
router.get('/flotte/maintenance/predict', authenticateToken, predictMaintenance);
router.get('/ventes/predict', authenticateToken, predictSales);
router.get('/exportations/predict', authenticateToken, predictExports);

// ─── Analyse ───
router.get('/analyse-global', authenticateToken, getGlobalAnalysis);
router.get('/anomalies', authenticateToken, getAnomalies);
router.post('/anomalies/check', authenticateToken, checkAnomalies);
router.post('/anomalies-operationnelles/detecter', authenticateToken, detectOperationalAnomalies);
router.post('/fraude/detecter', authenticateToken, detectFraud);
router.get('/risques/analyser', authenticateToken, analyzeRisks);
router.post('/rapports/generer', authenticateToken, generateReport);

// ─── Conversationnel & Recommandations ───
router.get('/recommandations', authenticateToken, getRecommandations);
router.post('/chat', authenticateToken, chatAssistant);
router.get('/flotte/optimiser', authenticateToken, optimizeFleet);
router.get('/recommandations-strategiques', authenticateToken, getStrategicRecommendations);

module.exports = router;
