const db = require('../config/db');

// ✅ Envoyer un message
const sendMessage = async (req, res) => {
  const { receiverId, content, productId } = req.body;
  const senderId = req.user.userId;

  if (!receiverId || !content) {
    return res.status(400).json({ message: 'Contenu ou destinataire manquant.' });
  }

  try {
    await db.execute(
      'INSERT INTO messages (sender_id, receiver_id, content, product_id) VALUES (?, ?, ?, ?)',
      [senderId, receiverId, content, productId || null]
    );

    res.status(201).json({ message: 'Message envoyé avec succès' });
  } catch (err) {
    console.error('❌ Erreur sendMessage:', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ✅ Voir tous les messages de l'utilisateur connecté avec infos
const getMessagesForUser = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [messages] = await db.execute(
      `
      SELECT 
        m.*,
        s.username AS sender_name,
        r.username AS receiver_name,
        p.title AS product_title,
        p.image AS product_image
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      LEFT JOIN products p ON m.product_id = p.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
      `,
      [userId, userId]
    );

    res.json(messages);
  } catch (err) {
    console.error('❌ Erreur getMessagesForUser:', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ✅ Voir conversation entre 2 utilisateurs avec infos
const getMessagesWithUser = async (req, res) => {
  const userId = req.user.userId;
  const receiverId = req.params.receiverId;

  try {
    const [messages] = await db.execute(
      `
      SELECT 
        m.*,
        s.username AS sender_name,
        r.username AS receiver_name,
        p.title AS product_title,
        p.image AS product_image
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      LEFT JOIN products p ON m.product_id = p.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
      `,
      [userId, receiverId, receiverId, userId]
    );

    res.json(messages);
  } catch (err) {
    console.error('❌ Erreur getMessagesWithUser:', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = {
  sendMessage,
  getMessagesForUser,
  getMessagesWithUser,
};
