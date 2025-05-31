const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const {
  createProduct,
  getAllProducts,
  getProductById,
  deleteProductById,
  updateProductById,
  getPaginatedProducts,
  searchProducts,
  insertProductImages,
  getImagesByProductId,
} = require('../models/product.model');

// ✅ Ajouter un produit avec images
const addProduct = async (req, res) => {
  try {
    const { title, price, description, category } = req.body;
    const userId = req.user.userId;
    const files = req.files;

    if (!title || !price || !files?.length || !category) {
      return res.status(400).json({ message: 'Champs requis manquants ou aucune image fournie' });
    }

    const firstImage = files[0].filename;
    const result = await createProduct(title, price, description, firstImage, userId, category);
    const productId = result.insertId;

    const imagePaths = files.map((file) => file.filename);
    await insertProductImages(productId, imagePaths);

    res.status(201).json({ message: 'Produit avec images ajouté avec succès' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout", error: error.message });
  }
};

// ✅ Lister les produits (avec recherche, pagination, filtrage)
const listProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;

    // Recherche par mot-clé
    if (search) {
      const results = await searchProducts(search);
      return res.json(results);
    }

    // Filtrage par catégorie
    if (category && category !== 'Toutes') {
      const [rows] = await db.execute(
        'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [category, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );
      return res.json(rows);
    }

    // Filtrage par statut
    if (status && ['actif', 'vendu', 'attente'].includes(status)) {
      const [rows] = await db.execute(
        'SELECT * FROM products WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [status, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );
      return res.json(rows);
    }

    const products = await getPaginatedProducts(page, limit);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des produits', error: error.message });
  }
};

// ✅ Récupérer un produit
const getOneProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

    const images = await getImagesByProductId(id);
    product.images = images;

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer un produit
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

    if (product.user_id !== userId) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce produit' });
    }

    await deleteProductById(id);
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Modifier un produit
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, description, category } = req.body;
    const userId = req.user.userId;
    const files = req.files;

    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

    if (product.user_id !== userId) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce produit' });
    }

    const newImage = (files && files.length > 0) ? files[0].filename : product.image;
    await updateProductById(id, title, price, description, newImage, userId, category);

    if (files && files.length > 0) {
      const imagePaths = files.map((file) => file.filename);
      await insertProductImages(id, imagePaths);
    }

    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer une image spécifique
const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [image] = await db.execute(`
      SELECT pi.image_url, p.user_id 
      FROM product_images pi 
      JOIN products p ON p.id = pi.product_id 
      WHERE pi.id = ?`, [id]);

    if (!image.length) return res.status(404).json({ message: "Image non trouvée" });

    if (image[0].user_id !== userId) {
      return res.status(403).json({ message: "Non autorisé à supprimer cette image" });
    }

    await db.execute('DELETE FROM product_images WHERE id = ?', [id]);

    const imagePath = path.join(__dirname, '..', 'uploads', image[0].image_url);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    res.json({ message: "Image supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'image", error: error.message });
  }
};

// ✅ Supprimer toutes les images d’un produit
const deleteAllProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const product = await getProductById(id);
    if (!product || product.user_id !== userId) {
      return res.status(403).json({ message: "Non autorisé ou produit inexistant" });
    }

    const [images] = await db.execute('SELECT id, image_url FROM product_images WHERE product_id = ?', [id]);

    for (const image of images) {
      const imagePath = path.join(__dirname, '..', 'uploads', image.image_url);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      await db.execute('DELETE FROM product_images WHERE id = ?', [image.id]);
    }

    res.json({ message: "Toutes les images du produit ont été supprimées" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression des images", error: error.message });
  }
};

// ✅ Marquer un produit comme vendu
const markProductAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [rows] = await db.execute(
      'SELECT * FROM products WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: "Accès refusé ou produit introuvable" });
    }

    await db.execute('UPDATE products SET status = "vendu" WHERE id = ?', [id]);

    res.json({ message: "✅ Produit marqué comme vendu" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  addProduct,
  listProducts,
  getOneProduct,
  deleteProduct,
  updateProduct,
  deleteProductImage,
  deleteAllProductImages,
  markProductAsSold,
};
