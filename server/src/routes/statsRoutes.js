const express = require('express');
const { getDashboardStats, getExecutiveAvanceStats, getRecentActivities } = require('../controllers/statsController');
const { getDurabiliteStats } = require('../controllers/durabiliteController');
const { getCommercialStats } = require('../controllers/commercialController');
const { getExportStats } = require('../controllers/exportController');
const { getOperationnelStats } = require('../controllers/operationnelController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getDashboardStats);
router.get('/commercial', authenticateToken, getCommercialStats);
router.get('/durabilite', authenticateToken, getDurabiliteStats);
router.get('/export', authenticateToken, getExportStats);
router.get('/operationnel', authenticateToken, getOperationnelStats);

// Executive Dashboard Avancé — données consolidées pour la vue DG
router.get('/executif-avance', authenticateToken, getExecutiveAvanceStats);

// Activités récentes combinées
router.get('/activities', authenticateToken, getRecentActivities);

module.exports = router;
