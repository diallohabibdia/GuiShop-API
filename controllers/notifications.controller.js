const {
  getNotificationsByUserId,
  markAsRead,
  createNotification,
  deleteNotification,
  deleteAllNotificationsForUser,
  getNotificationById
} = require('../models/notifications.model');

// ✅ Récupérer toutes les notifications d’un utilisateur
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const notifications = await getNotificationsByUserId(userId);
    res.json(notifications);
  } catch (error) {
    console.error('❌ Erreur getUserNotifications:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Marquer une notification comme lue
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    const notif = await getNotificationById(notificationId);
    if (!notif) return res.status(404).json({ message: 'Notification non trouvée' });

    if (notif.userId !== userId) {
      return res.status(403).json({ message: 'Permission refusée' });
    }

    await markAsRead(notificationId);
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('❌ Erreur markNotificationAsRead:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Créer une notification (userId depuis token, targetRoute optionnel)
exports.createNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type, title, body, icon } = req.body;
    const targetRoute = typeof req.body?.targetRoute === 'string' ? req.body.targetRoute : null;

    if (!userId || !type || !title || !body || !icon) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    console.log("🧪 Données reçues:", { userId, type, title, body, icon, targetRoute });

    await createNotification(userId, type, title, body, icon, targetRoute);
    res.status(201).json({ message: 'Notification créée avec succès' });
  } catch (error) {
    console.error('❌ Erreur createNotification:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer une notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const notif = await getNotificationById(id);
    if (!notif) return res.status(404).json({ message: 'Notification non trouvée' });

    if (notif.userId !== userId) {
      return res.status(403).json({ message: 'Permission refusée' });
    }

    await deleteNotification(id);
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('❌ Erreur deleteNotification:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer toutes les notifications d’un utilisateur
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    await deleteAllNotificationsForUser(userId);
    res.json({ message: 'Toutes les notifications supprimées' });
  } catch (error) {
    console.error('❌ Erreur clearAllNotifications:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
