const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateMe } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

const registerValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe doit contenir au moins 6 caractères'),
  body('nom').trim().notEmpty().withMessage('Nom est requis'),
  body('prenom').trim().notEmpty().withMessage('Prénom est requis')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe est requis')
];

router.post('/register', validate(registerValidation), register);

router.post('/login', validate(loginValidation), login);

router.get('/me', authenticateToken, getMe);
router.patch('/me', authenticateToken, updateMe);

module.exports = router;
