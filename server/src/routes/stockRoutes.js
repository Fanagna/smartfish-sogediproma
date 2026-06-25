const express = require('express');
const { body } = require('express-validator');
const {
  getStocks,
  getStockById,
  createStock,
  updateStock,
  updateSeuils,
  deleteStock
} = require('../controllers/stockController');
const {
  getRupture,
  getSurstock,
  getRecommendation,
  getRotation,
  getCritiques
} = require('../controllers/stockIntelligenceController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

const stockValidation = [
  body('bateauId').isInt().withMessage('Bateau est requis'),
  body('espece').trim().notEmpty().withMessage('Espèce est requise'),
  body('quantite').isFloat({ min: 0 }).withMessage('Quantité doit être un nombre positif'),
  body('unite').trim().notEmpty().withMessage('Unité est requise')
];

const seuilsValidation = [
  body('seuils').isArray({ min: 1 }).withMessage('Seuils doit être un tableau'),
  body('seuils.*.id').isInt().withMessage('ID du stock est requis'),
  body('seuils.*.seuil').isFloat({ min: 0 }).withMessage('Seuil doit être un nombre positif')
];

router.get('/', authenticateToken, getStocks);
router.get('/:id', authenticateToken, getStockById);
router.post('/', authenticateToken, validate(stockValidation), createStock);
router.put('/:id', authenticateToken, validate(stockValidation), updateStock);
router.patch('/seuils', authenticateToken, validate(seuilsValidation), updateSeuils);
router.delete('/:id', authenticateToken, deleteStock);

// Stock Intelligence Endpoints (Jour 14-15)
router.get('/intelligence/rupture', authenticateToken, getRupture);
router.get('/intelligence/surstock', authenticateToken, getSurstock);
router.post('/intelligence/recommendation', authenticateToken, getRecommendation);
router.get('/intelligence/rotation', authenticateToken, getRotation);
router.get('/intelligence/critiques', authenticateToken, getCritiques);

module.exports = router;
