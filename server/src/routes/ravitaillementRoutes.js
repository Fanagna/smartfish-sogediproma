const express = require('express');
const router = express.Router();
const { createRavitaillement, getRavitaillements, deleteRavitaillement } = require('../controllers/ravitaillementController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// POST /api/ravitaillements — Créer un ravitaillement
router.post('/', authenticateToken, createRavitaillement);

// GET /api/ravitaillements/:bateauId — Historique des ravitaillements d'un bateau
router.get('/:bateauId', authenticateToken, getRavitaillements);

// DELETE /api/ravitaillements/:id — Supprimer un ravitaillement
router.delete('/:id', authenticateToken, deleteRavitaillement);

module.exports = router;
