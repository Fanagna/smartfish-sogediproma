const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getNotifications, markAsRead, markAllAsRead, createTestNotification } = require('../controllers/notificationController');

router.get('/', authenticateToken, getNotifications);
router.patch('/:id/read', authenticateToken, markAsRead);
router.patch('/read-all', authenticateToken, markAllAsRead);
router.post('/test', authenticateToken, createTestNotification);

module.exports = router;
