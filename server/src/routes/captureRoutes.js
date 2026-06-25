const express = require('express');
const { body } = require('express-validator');
const prisma = require('../config/database');
const {
  getCaptures,
  getCaptureById,
  createCapture,
  updateCapture,
  deleteCapture,
  getStatsMensuelles,
  getCapturesStats
} = require('../controllers/captureController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

const captureValidation = [
  // Accepte soit bateauId (entier) soit bateauNom (chaîne à résoudre)
  body('bateauId').optional({ values: 'null' }).isInt().withMessage('bateauId doit être un entier'),
  body('bateauNom').optional().trim().isString().withMessage('bateauNom doit être une chaîne'),
  body().custom((_, { req }) => {
    if (!req.body.bateauId && !req.body.bateauNom) {
      throw new Error('bateauId ou bateauNom est requis');
    }
    return true;
  }),
  body('espece').trim().notEmpty().withMessage('Espèce est requise'),
  body('poids').isFloat({ min: 0 }).withMessage('Poids doit être un nombre positif'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité doit être un entier positif'),
  body('zonePeche').trim().notEmpty().withMessage('Zone de pêche est requise')
];

router.get('/', authenticateToken, getCaptures);
router.get('/stats', authenticateToken, getCapturesStats);
router.get('/stats/mensuelles', authenticateToken, getStatsMensuelles);
router.get('/:id', authenticateToken, getCaptureById);
router.post('/', authenticateToken, validate(captureValidation), createCapture);
router.put('/:id', authenticateToken, validate(captureValidation), updateCapture);
router.delete('/:id', authenticateToken, deleteCapture);

// Import CSV en masse
router.post('/import', authenticateToken, async (req, res, next) => {
  try {
    const { captures } = req.body;
    if (!captures || !Array.isArray(captures) || captures.length === 0) {
      return res.status(400).json({ error: 'Tableau de captures requis' });
    }

    const results = { success: 0, errors: 0, errorsList: [] };
    const userId = req.user.id;

    for (let i = 0; i < captures.length; i++) {
      const row = captures[i];
      try {
        const espece = row.espece || row.ESPECE;
        const poids = parseFloat(row.poids || row.POIDS || 0);
        const quantite = parseInt(row.quantite || row.QUANTITE || 1);
        const bateauId = parseInt(row.bateauId || row.bateauid || row.BATEAU_ID || '');
        const zonePeche = row.zonePeche || row.zone || row.ZONE_PECHE || 'Non spécifiée';
        const profondeur = row.profondeur || row.PROFONDEUR ? parseFloat(row.profondeur || row.PROFONDEUR) : null;
        const temperature = row.temperature || row.TEMPERATURE ? parseFloat(row.temperature || row.TEMPERATURE) : null;

        if (!espece || !poids || poids <= 0 || !bateauId) {
          results.errors++;
          results.errorsList.push({ ligne: i + 1, erreur: 'Données incomplètes (espece, poids, bateauId requis)' });
          continue;
        }

        await prisma.capture.create({
          data: { bateauId, userId, espece, poids, quantite, zonePeche, profondeur, temperature }
        });
        results.success++;
      } catch (rowError) {
        results.errors++;
        results.errorsList.push({ ligne: i + 1, erreur: rowError.message });
      }
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
