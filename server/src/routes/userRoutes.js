const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

const createUserValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe doit contenir au moins 6 caractères'),
  body('nom').trim().notEmpty().withMessage('Nom est requis'),
  body('prenom').trim().notEmpty().withMessage('Prénom est requis')
];

const updateUserValidation = [
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('password').optional().isLength({ min: 6 }).withMessage('Mot de passe doit contenir au moins 6 caractères')
];

router.get('/', authenticateToken, getUsers);
router.get('/:id', authenticateToken, getUserById);
router.post('/', authenticateToken, authorizeRoles('ADMIN'), validate(createUserValidation), createUser);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), validate(updateUserValidation), updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteUser);

module.exports = router;
