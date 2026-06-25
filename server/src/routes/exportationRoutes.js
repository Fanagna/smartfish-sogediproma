const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
  getExportations,
  createExportation,
  getExportationById,
  updateExportationStatut,
  deleteExportation
} = require('../controllers/exportationController');

router.get('/', authenticateToken, getExportations);
router.post('/', authenticateToken, createExportation);
router.get('/:id', authenticateToken, getExportationById);
router.patch('/:id/statut', authenticateToken, updateExportationStatut);
router.delete('/:id', authenticateToken, deleteExportation);

module.exports = router;
