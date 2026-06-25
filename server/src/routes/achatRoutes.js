const express = require('express');
const { getAchats, createAchat, getAchatById, deleteAchat, getFournisseurs } = require('../controllers/achatController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', authenticateToken, getAchats);
router.get('/fournisseurs', authenticateToken, getFournisseurs);
router.get('/:id', authenticateToken, getAchatById);
router.post('/', authenticateToken, createAchat);
router.delete('/:id', authenticateToken, deleteAchat);

module.exports = router;
