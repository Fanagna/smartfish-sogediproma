const prisma = require('../config/database');
const { emitToUser, emitToRole } = require('./socketService');

const getNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
  const where = { userId };
  if (unreadOnly) where.read = false;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where })
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false }
  });

  return {
    notifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: parseInt(notificationId), userId }
  });
  if (!notification) throw new Error('Notification non trouvée');

  return prisma.notification.update({
    where: { id: parseInt(notificationId) },
    data: { read: true }
  });
};

const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
  return { success: true };
};

const createNotification = async (userId, message, type = 'info', link = null) => {
  const notification = await prisma.notification.create({
    data: { userId, message, type, link }
  });
  // 🔔 Émettre en temps réel via WebSocket
  emitToUser(userId, notification);
  return notification;
};

/** Notify all users with the given role(s) */
const notifyByRole = async (roles, message, type = 'info', link = null) => {
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true }
  });

  if (users.length === 0) return 0;

  // Create notifications one by one to get full objects + emit in real-time
  // Using individual creates (not createMany) so Prisma returns the full notification object
  const createdNotifications = await Promise.all(
    users.map(u =>
      prisma.notification.create({
        data: { userId: u.id, message, type, link }
      })
    )
  );

  // 🔔 Émettre en temps réel via WebSocket pour chaque utilisateur
  for (const notification of createdNotifications) {
    emitToUser(notification.userId, notification);
  }

  return createdNotifications.length;
};

/** Notify a specific user */
const notifyUser = async (userId, message, type = 'info', link = null) => {
  return createNotification(userId, message, type, link);
};

module.exports = {
  getNotifications, markAsRead, markAllAsRead,
  createNotification, notifyByRole, notifyUser
};
