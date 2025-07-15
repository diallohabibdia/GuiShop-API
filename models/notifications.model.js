const db = require('../config/db');

// ✅ Récupérer les notifications d’un utilisateur
const getNotificationsByUserId = async (userId) => {
  const [rows] = await db.execute(
    `SELECT 
       id, 
       type, 
       title, 
       body, 
       icon, 
       targetRoute, 
       isRead,
       createdAt,
       DATE_FORMAT(createdAt, '%d/%m/%Y à %Hh%i') AS formattedTime
     FROM notification 
     WHERE userId = ? 
     ORDER BY createdAt DESC`,
    [userId]
  );
  return rows;
};

// ✅ Récupérer UNE notification par ID
const getNotificationById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM notification WHERE id = ?`,
    [id]
  );
  return rows[0];
};

// ✅ Marquer une notification comme lue
const markAsRead = async (notificationId) => {
  const [result] = await db.execute(
    'UPDATE notification SET isRead = 1 WHERE id = ?',
    [notificationId]
  );
  return result;
};

// ✅ Créer une nouvelle notification (targetRoute peut être null ou absent)
const createNotification = async (userId, type, title, body, icon, targetRoute = null) => {
  const safeTargetRoute = typeof targetRoute === 'string' ? targetRoute : null;

  const [result] = await db.execute(
    `INSERT INTO notification 
      (userId, type, title, body, icon, targetRoute, createdAt, isRead) 
     VALUES (?, ?, ?, ?, ?, ?, NOW(), 0)`,
    [userId, type, title, body, icon, safeTargetRoute]
  );
  return result;
};

// ✅ Supprimer une notification
const deleteNotification = async (id) => {
  const [result] = await db.execute('DELETE FROM notification WHERE id = ?', [id]);
  return result;
};

// ✅ Supprimer toutes les notifications d’un utilisateur
const deleteAllNotificationsForUser = async (userId) => {
  const [result] = await db.execute('DELETE FROM notification WHERE userId = ?', [userId]);
  return result;
};

module.exports = {
  getNotificationsByUserId,
  getNotificationById,
  markAsRead,
  createNotification,
  deleteNotification,
  deleteAllNotificationsForUser,
};
