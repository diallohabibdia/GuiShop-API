const db = require('../config/db');

/**
 * ✅ Ajouter un favori (post ou produit)
 * @param {number} userId - ID de l'utilisateur
 * @param {Object} options - postId ou productId (au moins un)
 */
exports.addFavorite = async (userId, { postId = null, productId = null }) => {
  if (!postId && !productId) {
    throw new Error("postId ou productId est requis");
  }

  await db.execute(
    `INSERT IGNORE INTO Favorite (userId, postId, productId, created_at)
     VALUES (?, ?, ?, NOW())`,
    [userId, postId, productId]
  );
};

/**
 * ✅ Supprimer un favori (post ou produit)
 * @param {number} userId
 * @param {Object} options - postId ou productId
 */
exports.removeFavorite = async (userId, { postId = null, productId = null }) => {
  if (!postId && !productId) {
    throw new Error("postId ou productId est requis");
  }

  const field = postId ? 'postId' : 'productId';
  const value = postId || productId;

  await db.execute(
    `DELETE FROM Favorite WHERE userId = ? AND ${field} = ?`,
    [userId, value]
  );
};

/**
 * ✅ Obtenir tous les favoris d’un utilisateur avec détails
 * (post ou produit)
 */
exports.getUserFavorites = async (userId) => {
  const [rows] = await db.execute(`
    SELECT 
      f.id, f.postId, f.productId,
      p.title AS productTitle, p.price, pi.filename AS productImage,
      ps.content AS postText
    FROM Favorite f
    LEFT JOIN Product p ON f.productId = p.id
    LEFT JOIN ProductImage pi ON pi.productId = p.id AND pi.id = (
      SELECT id FROM ProductImage WHERE productId = p.id LIMIT 1
    )
    LEFT JOIN Post ps ON f.postId = ps.id
    WHERE f.userId = ?
    ORDER BY f.created_at DESC
  `, [userId]);

  return rows;
};
