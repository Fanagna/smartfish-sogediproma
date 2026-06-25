const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const register = async (userData) => {
  const { email, password, nom, prenom, role } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Un utilisateur avec cet email existe déjà');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nom,
      prenom,
      role: role || 'OBSERVATEUR'
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      createdAt: true
    }
  });

  const token = generateToken(user.id);

  return { user, token };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const token = generateToken(user.id);

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user;
};

module.exports = { register, login, getMe };
