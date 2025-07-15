const db = require('../config/db');

// ✅ Créer un produit (sans image)
const createProduct = async (title, price, description, userId, categoryId, location) => {
  const [result] = await db.query(
    `INSERT INTO Product 
      (title, price, description, userId, categoryId, location, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [title, price, description, userId, categoryId, location]
  );
  return result;
};

// ✅ Récupérer tous les produits
const getAllProducts = async () => {
  const [rows] = await db.query('SELECT * FROM Product ORDER BY created_at DESC');
  return rows;
};

// ✅ Récupérer un produit par ID
const getProductById = async (id) => {
  const [rows] = await db.query('SELECT * FROM Product WHERE id = ?', [id]);
  return rows[0];
};

// ✅ Supprimer un produit par ID
const deleteProductById = async (id) => {
  const [result] = await db.query('DELETE FROM Product WHERE id = ?', [id]);
  return result;
};

// ✅ Mettre à jour un produit (sans image)
const updateProductById = async (id, title, price, description, categoryId, location, userId) => {
  const [result] = await db.query(
    `UPDATE Product 
     SET title = ?, price = ?, description = ?, categoryId = ?, location = ?
     WHERE id = ? AND userId = ?`,
    [title, price, description, categoryId, location, id, userId]
  );
  return result;
};

// ✅ Marquer un produit comme vendu
const markAsSold = async (productId) => {
  return await updateProductStatus(productId, 'vendu');
};

// ✅ Mettre à jour le statut d’un produit (actif, vendu, attente)
const updateProductStatus = async (productId, status) => {
  const [result] = await db.query(
    `UPDATE Product SET status = ? WHERE id = ?`,
    [status, productId]
  );
  return result;
};

// ✅ Récupérer les produits avec pagination
const getPaginatedProducts = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const [rows] = await db.query(
    `SELECT * FROM Product 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)]
  );
  return rows;
};

// ✅ Rechercher des produits par mot-clé dans titre ou description
const searchProducts = async (keyword) => {
  const like = `%${keyword}%`;
  const [rows] = await db.query(
    `SELECT * FROM Product 
     WHERE title LIKE ? OR description LIKE ? 
     ORDER BY created_at DESC`,
    [like, like]
  );
  return rows;
};

// ✅ Ajouter des images à un produit
const insertProductImages = async (productId, imagePaths) => {
  if (!imagePaths.length) return;
  const values = imagePaths.map(url => [url, productId]);
  await db.query('INSERT INTO ProductImage (url, productId) VALUES ?', [values]);
};

// ✅ Récupérer les images d’un produit
const getImagesByProductId = async (productId) => {
  const [rows] = await db.query('SELECT url FROM ProductImage WHERE productId = ?', [productId]);
  return rows;
};

// ✅ Récupérer les produits d’un utilisateur (avec image principale)
const getProductsByUserId = async (userId) => {
  const [rows] = await db.query(
    `SELECT 
       p.id, p.title, p.price, p.description, p.status, p.location, p.created_at,
       (SELECT url FROM ProductImage WHERE productId = p.id ORDER BY id ASC LIMIT 1) AS media
     FROM Product p
     WHERE p.userId = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  deleteProductById,
  updateProductById,
  markAsSold,
  updateProductStatus,
  getPaginatedProducts,
  searchProducts,
  insertProductImages,
  getImagesByProductId,
  getProductsByUserId,
};
