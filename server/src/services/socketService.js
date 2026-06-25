const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.io server with JWT authentication
 * @param {import('socket.io').Server} socketIO
 */
function initSocketIO(socketIO) {
  io = socketIO;

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentification requise'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    // Join user's personal room for targeted notifications
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);

    logger.info(`🔌 Utilisateur connecté (socket: ${socket.id}, userId: ${socket.userId})`);

    // Join role room for broadcast notifications
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    // Send current connection acknowledgment
    socket.emit('connected', {
      userId: socket.userId,
      message: 'Connecté au système de notifications temps réel'
    });

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Utilisateur déconnecté (socket: ${socket.id}, reason: ${reason})`);
    });

    socket.on('error', (err) => {
      logger.error(`⚠️ Erreur socket (${socket.id}): ${err.message}`);
    });
  });

  logger.info('📡 Service Socket.io initialisé');
}

/**
 * Emit a notification event to a specific user in real-time
 * @param {number} userId - The user ID
 * @param {object} notification - The notification object
 */
function emitToUser(userId, notification) {
  if (!io) {
    logger.warn('Socket.io non initialisé, impossible d\'émettre');
    return;
  }
  const room = `user:${userId}`;
  io.to(room).emit('notification:new', notification);
  logger.debug(`Notification émise vers ${room}: ${notification.message?.substring(0, 50)}`);
}

/**
 * Emit a notification event to all users with a specific role
 * @param {string|string[]} roles - Role(s) to broadcast to
 * @param {object} notification - The notification object
 */
function emitToRole(roles, notification) {
  if (!io) {
    logger.warn('Socket.io non initialisé, impossible d\'émettre');
    return;
  }
  const roleList = Array.isArray(roles) ? roles : [roles];
  for (const role of roleList) {
    const room = `role:${role}`;
    io.to(room).emit('notification:new', notification);
  }
  logger.debug(`Notification émise vers les rôles ${roleList.join(', ')}`);
}

/**
 * Get the current Socket.io server instance
 */
function getIO() {
  return io;
}

module.exports = {
  initSocketIO,
  emitToUser,
  emitToRole,
  getIO
};
