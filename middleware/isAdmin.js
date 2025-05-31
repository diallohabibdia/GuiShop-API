const db = require('../config/db');

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [rows] = await db.execute('SELECT is_admin FROM users WHERE id = ?', [userId]);

    if (rows.length === 0 || !rows[0].is_admin) {
      return res.status(403).json({ message: "Accès réservé aux administrateurs ❌" });
    }

    next(); // autorisé
  } catch (error) {
    console.error("❌ Erreur isAdmin:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = isAdmin;
