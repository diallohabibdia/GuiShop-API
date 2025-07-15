const express = require('express');
const router = express.Router();

// 🧠 Contrôleurs
const {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification
} = require('../controllers/notifications.controller');

// 🔐 Middleware
const verifyToken = require('../middleware/auth.middleware');

// 📥 GET /api/notifications → Notifications de l'utilisateur connecté
router.get('/', verifyToken, getUserNotifications);

// ✅ POST /api/notifications → Créer une nouvelle notification (protégée par token)
router.post('/', verifyToken, createNotification);

// ✅ PATCH /api/notifications/:id/read → Marquer une notification comme lue
router.patch('/:id/read', verifyToken, markNotificationAsRead);

// ✅ DELETE /api/notifications/:id → Supprimer une notification
router.delete('/:id', verifyToken, deleteNotification);

// ✅ DELETE /api/notifications/clear → Supprimer toutes les notifications de l'utilisateur
router.delete('/clear', verifyToken, clearAllNotifications);

module.exports = router;
