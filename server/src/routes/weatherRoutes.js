const express = require('express');
const { getWeather, refreshWeather } = require('../controllers/weatherController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/meteo — obtenir les données météo (avec cache)
router.get('/', authenticateToken, getWeather);

// POST /api/meteo/refresh — forcer le rafraîchissement
router.post('/refresh', authenticateToken, refreshWeather);

module.exports = router;
