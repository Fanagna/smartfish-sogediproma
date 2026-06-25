const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient
} = require('../controllers/clientController');

router.get('/', authenticateToken, getClients);
router.post('/', authenticateToken, createClient);
router.get('/:id', authenticateToken, getClientById);
router.put('/:id', authenticateToken, updateClient);
router.delete('/:id', authenticateToken, deleteClient);

module.exports = router;
