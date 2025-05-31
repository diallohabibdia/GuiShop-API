// models/product.model.js
const db = require('../config/db');

// ✅ Créer un produit avec catégorie
const createProduct = async (title, price, description, imageUrl, userId, category) => {
  const [result] = await db.execute(
    'INSERT INTO products (title, price, description, image, user_id, category) VALUES (?, ?, ?, ?, ?, ?)',
    [title, price, description, imageUrl, userId, category]
  );
  return result;
};

// ✅ Récupérer tous les produits
const getAllProducts = async () => {
  const [rows] = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
  return rows;
};

// ✅ Récupérer un produit par ID
const getProductById = async (id) => {
  const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
};

// ✅ Supprimer un produit par ID
const deleteProductById = async (id) => {
  const [result] = await db.execute('DELETE FROM products WHERE id = ?', [id]);
  return result;
};

// ✅ Mettre à jour un produit avec catégorie
const updateProductById = async (id, title, price, description, imageUrl, userId, category) => {
  const [result] = await db.execute(
    'UPDATE products SET title = ?, price = ?, description = ?, image = ?, category = ? WHERE id = ? AND user_id = ?',
    [title, price, description, imageUrl, category, id, userId]
  );
  return result;
};

// ✅ Récupérer des produits paginés
const getPaginatedProducts = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const [rows] = await db.execute(
    'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [parseInt(limit), parseInt(offset)]
  );
  return rows;
};

// ✅ Recherche de produits par mot-clé
const searchProducts = async (keyword) => {
  const likeQuery = `%${keyword}%`;
  const [rows] = await db.execute(
    'SELECT * FROM products WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC',
    [likeQuery, likeQuery]
  );
  return rows;
};

// ✅ Ajouter plusieurs images à un produit
const insertProductImages = async (productId, imagePaths) => {
  const values = imagePaths.map((path) => [productId, path]);
  await db.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [values]);
};

// ✅ Récupérer les images d'un produit
const getImagesByProductId = async (productId) => {
  const [rows] = await db.execute('SELECT image_url FROM product_images WHERE product_id = ?', [productId]);
  return rows;
};

// ✅ Export des fonctions
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  deleteProductById,
  updateProductById,
  getPaginatedProducts,
  searchProducts,
  insertProductImages,
  getImagesByProductId,
};
