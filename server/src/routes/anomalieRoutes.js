const express = require('express');
const { body } = require('express-validator');
const { getAnomalies, updateAnomalie } = require('../controllers/anomalieController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

const updateValidation = [
  body('statut').isIn(['EN_ATTENTE', 'EN_COURS', 'TRAITE']).withMessage('Statut invalide')
];

router.get('/', authenticateToken, getAnomalies);
router.patch('/:id', authenticateToken, validate(updateValidation), updateAnomalie);

module.exports = router;
