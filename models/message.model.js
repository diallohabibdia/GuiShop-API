const db = require('../config/db');

/**
 * 🔄 Récupère toutes les conversations d’un utilisateur avec :
 * - Le produit concerné
 * - L’autre participant (nom, avatar, id)
 * - Le dernier message échangé
 * - La date du dernier message
 */
const getUserConversations = async (userId) => {
  if (!userId) {
    throw new Error('userId est requis pour getUserConversations');
  }

  const [rows] = await db.execute(
    `
    SELECT 
      m.product_id,
      p.title AS productTitle,
      u.id AS receiver_id,
      u.username AS participant,
      u.avatar,

      -- Dernier message
      (
        SELECT content
        FROM messages
        WHERE product_id = m.product_id
          AND (sender_id = ? OR receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT 1
      ) AS lastMessage,

      -- Date du dernier message
      (
        SELECT created_at
        FROM messages
        WHERE product_id = m.product_id
          AND (sender_id = ? OR receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT 1
      ) AS lastDate

    FROM messages m
    JOIN products p ON p.id = m.product_id

    -- Trouver l'autre participant (celui qui n'est pas l'utilisateur)
    JOIN users u ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)

    -- Tous les messages où l’utilisateur est émetteur ou récepteur
    WHERE m.sender_id = ? OR m.receiver_id = ?

    GROUP BY m.product_id, u.id, p.title, u.username, u.avatar
    ORDER BY lastDate DESC
    `,
    [
      userId, userId,  // pour SELECT lastMessage
      userId, userId,  // pour SELECT lastDate
      userId,          // pour JOIN users u
      userId, userId   // pour WHERE clause
    ]
  );

  return rows;
};

module.exports = {
  getUserConversations,
};
