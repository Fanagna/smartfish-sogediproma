const notificationService = require('../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getNotifications(req.user.id, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true'
    });
    res.json(result);
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json(notification);
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (error) { next(error); }
};

const createTestNotification = async (req, res, next) => {
  try {
    const types = ['info', 'success', 'warning', 'error'];
    const type = types[Math.floor(Math.random() * types.length)];

    const messages = {
      info: 'ℹ️ Mise à jour IA : Nouvelle analyse des zones de pêche disponible',
      success: '✅ Capture enregistrée : +85 kg de Dorade par "Le Marin"',
      warning: '⚠️ Attention : Stock de Maquereau proche du seuil critique (55 kg)',
      error: '🚨 Alerte système : Anomalie de température détectée sur Ocean Star'
    };

    const links = {
      info: '/ia/zones-peche',
      success: '/captures',
      warning: '/stocks',
      error: '/anomalies'
    };

    const notification = await notificationService.createNotification(
      req.user.id,
      messages[type],
      type,
      links[type]
    );

    res.status(201).json({
      message: '✅ Notification test créée et envoyée en temps réel',
      notification
    });
  } catch (error) { next(error); }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createTestNotification };
