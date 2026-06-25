const express = require('express');
const { body } = require('express-validator');
const {
  getOrdresMission,
  getOrdreMissionById,
  createOrdreMission,
  updateOrdreMission,
  deleteOrdreMission
} = require('../controllers/ordreMissionController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

const ordreMissionValidation = [
  body('numero').trim().notEmpty().withMessage('Numéro d\'ordre de mission requis'),
  body('bateauNom').trim().notEmpty().withMessage('Nom du bateau requis'),
  body('bateauType').trim().notEmpty().withMessage('Type du bateau requis'),
  body('objetMission').trim().notEmpty().withMessage('Objet de la mission requis'),
  body('destination').trim().notEmpty().withMessage('Destination requise'),
  body('chefMission').trim().notEmpty().withMessage('Chef de mission requis'),
  body('capitaine').trim().notEmpty().withMessage('Capitaine requis'),
  body('dateDepart').isISO8601().withMessage('Date de départ invalide'),
  body('dateArrivee').isISO8601().withMessage('Date d\'arrivée invalide')
];

router.get('/', authenticateToken, getOrdresMission);
router.get('/:id', authenticateToken, getOrdreMissionById);
router.post('/', authenticateToken, validate(ordreMissionValidation), createOrdreMission);
router.put('/:id', authenticateToken, validate(ordreMissionValidation), updateOrdreMission);
router.delete('/:id', authenticateToken, deleteOrdreMission);

module.exports = router;
