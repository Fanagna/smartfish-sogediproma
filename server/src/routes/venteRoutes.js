const express = require('express');
const { getVentes, createVente, getVenteById, deleteVente } = require('../controllers/venteController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', authenticateToken, getVentes);
router.get('/:id', authenticateToken, getVenteById);
router.post('/', authenticateToken, createVente);
router.delete('/:id', authenticateToken, deleteVente);

module.exports = router;
