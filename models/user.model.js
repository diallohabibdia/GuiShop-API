const db = require('../config/db');

// ✅ Trouver un utilisateur par ID
const getUserById = async (id) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('❌ Erreur getUserById:', error.message);
    throw error;
  }
};

// ✅ Récupérer les produits "actifs" d’un utilisateur
const getUserProducts = async (userId) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE user_id = ? AND status = "actif"',
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('❌ Erreur getUserProducts:', error.message);
    throw error;
  }
};

// ✅ Mettre à jour l’avatar d’un utilisateur
const updateUserAvatar = async (id, filename) => {
  try {
    const [result] = await db.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [filename, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('❌ Erreur updateUserAvatar:', error.message);
    throw error;
  }
};

module.exports = {
  getUserById,
  getUserProducts,
  updateUserAvatar,
};
