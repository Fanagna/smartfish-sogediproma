const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  let statusCode = 500;
  let message = 'Erreur interne du serveur';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  } else if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Cette valeur est déjà utilisée';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({ error: 'Route non trouvée' });
};

module.exports = { errorHandler, notFoundHandler };
