const express = require('express');
const { body } = require('express-validator');
const {
  getBateaux,
  getBateauById,
  createBateau,
  updateBateau,
  deleteBateau,
  utiliserCarburant,
  remplirCarburant
} = require('../controllers/bateauController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

const bateauValidation = [
  body('nom').trim().notEmpty().withMessage('Nom du bateau est requis'),
  body('immatriculation').trim().notEmpty().withMessage('Immatriculation est requise'),
  body('type').trim().notEmpty().withMessage('Type du bateau est requis'),
  body('longueur').isFloat({ min: 0 }).withMessage('Longueur doit être un nombre positif'),
  body('capitaine').trim().notEmpty().withMessage('Capitaine est requis')
];

const carburantValidation = [
  body('quantite').isFloat({ min: 0 }).withMessage('Quantité doit être un nombre positif')
];

router.get('/', authenticateToken, getBateaux);
router.get('/:id', authenticateToken, getBateauById);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'CAPITAINE'), validate(bateauValidation), createBateau);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'CAPITAINE'), validate(bateauValidation), updateBateau);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteBateau);
router.post('/:id/carburant/utiliser', authenticateToken, authorizeRoles('ADMIN', 'CAPITAINE'), validate(carburantValidation), utiliserCarburant);
router.post('/:id/carburant/remplir', authenticateToken, authorizeRoles('ADMIN', 'CAPITAINE'), validate(carburantValidation), remplirCarburant);

module.exports = router;
