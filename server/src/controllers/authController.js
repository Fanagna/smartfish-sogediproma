const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { email, password, nom, prenom, role } = req.body;
    const result = await authService.register({ email, password, nom, prenom, role });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { nom, prenom, email, password, role } = req.body;
    const bcrypt = require('bcryptjs');
    const prisma = require('../config/database');

    const data = {};
    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);
    // Seul un ADMIN peut modifier son propre rôle
    if (role && req.user.role === 'ADMIN') {
      const validRoles = ['ADMIN', 'CAPITAINE', 'OBSERVATEUR'];
      if (validRoles.includes(role)) {
        data.role = role;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ ...user, message: 'Profil mis à jour avec succès' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateMe };
