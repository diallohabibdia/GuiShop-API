const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const BASE_URL = process.env.BASE_URL || "http://localhost:8082";

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
} = require("../models/product.model");

// ✅ Ajouter un produit
const addProduct = async (req, res) => {
  try {
    const { title, price, description, category, location } = req.body;
    const userId = req.user?.id;
    const files = req.files;

    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    if (!title || !price || !description || !category || !files?.length) {
      return res.status(400).json({ message: "Champs requis manquants ou aucune image fournie" });
    }
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: "Prix invalide" });
    }

    const productLocation = location || req.user?.location || null;
    const firstImage = files[0].filename;

    const result = await createProduct(title, price, description, firstImage, userId, category, productLocation);
    const productId = result.insertId;

    const imagePaths = files.map((file) => file.filename);
    await insertProductImages(productId, imagePaths);

    res.status(201).json({ message: "Produit ajouté avec succès", productId });
  } catch (error) {
    console.error("❌ Erreur addProduct:", error);
    res.status(500).json({ message: "Erreur lors de l'ajout du produit", error: error.message });
  }
};

// ✅ Lister les produits
const listProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status, location } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let baseQuery = `
      SELECT 
        p.*, u.prenom, u.nom, 
        GROUP_CONCAT(pi.url) AS images
      FROM Product p
      JOIN User u ON p.userId = u.id
      LEFT JOIN ProductImage pi ON pi.productId = p.id
    `;

    const conditions = [];
    const values = [];

    if (search) {
      conditions.push(`p.title LIKE ?`);
      values.push(`%${search}%`);
    }
    if (category && category !== "Toutes") {
      conditions.push(`p.category_id = ?`);
      values.push(category);
    }
    if (location && location !== "Toutes") {
      conditions.push(`p.location = ?`);
      values.push(location);
    }
    if (status && ["actif", "vendu", "attente"].includes(status)) {
      conditions.push(`p.status = ?`);
      values.push(status);
    }

    if (conditions.length > 0) {
      baseQuery += " WHERE " + conditions.join(" AND ");
    }

    baseQuery += `
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    values.push(parseInt(limit), offset);

    const [rows] = await db.execute(baseQuery, values);

    const formatted = rows.map((p) => ({
      ...p,
      images: p.images ? p.images.split(",").map(img => `${BASE_URL}/uploads/${img}`) : [],
      seller: `${p.prenom} ${p.nom}`,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Erreur listProducts:", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des produits", error: error.message });
  }
};

// ✅ Détails d’un produit
const getOneProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });

    const images = await getImagesByProductId(id);
    product.images = images.map(img => `${BASE_URL}/uploads/${img.url}`);

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Supprimer un produit
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });
    if (product.userId !== userId) return res.status(403).json({ message: "Non autorisé" });

    const images = await getImagesByProductId(id);
    for (const img of images) {
      const filePath = path.join(__dirname, "../uploads", img.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.execute("DELETE FROM ProductImage WHERE productId = ?", [id]);
    await deleteProductById(id);
    res.json({ message: "Produit supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Modifier un produit
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, description, category, location } = req.body;
    const userId = req.user?.id;
    const files = req.files;

    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });
    if (product.userId !== userId) return res.status(403).json({ message: "Non autorisé" });

    const updatedLocation = location || product.location;
    const image = files?.[0]?.filename || product.image;

    await updateProductById(id, title, price, description, image, userId, category, updatedLocation);

    if (files?.length) {
      const images = files.map((f) => f.filename);
      await insertProductImages(id, images);
    }

    res.json({ message: "Produit mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Marquer comme vendu
const markProductAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [rows] = await db.execute("SELECT * FROM Product WHERE id = ? AND userId = ?", [id, userId]);
    if (!rows.length) return res.status(403).json({ message: "Accès refusé" });

    await db.execute('UPDATE Product SET status = "vendu" WHERE id = ?', [id]);
    res.json({ message: "Produit marqué comme vendu" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Mettre à jour le statut
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    const [rows] = await db.execute("SELECT * FROM Product WHERE id = ? AND userId = ?", [id, userId]);
    if (!rows.length) return res.status(403).json({ message: "Accès refusé" });

    await db.execute("UPDATE Product SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: "Statut mis à jour" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Supprimer une image
const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [rows] = await db.execute(`
      SELECT pi.url, p.userId 
      FROM ProductImage pi 
      JOIN Product p ON pi.productId = p.id 
      WHERE pi.id = ?`, [id]);

    if (!rows.length) return res.status(404).json({ message: "Image non trouvée" });
    if (rows[0].userId !== userId) return res.status(403).json({ message: "Non autorisé" });

    const filePath = path.join(__dirname, "../uploads", rows[0].url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.execute("DELETE FROM ProductImage WHERE id = ?", [id]);
    res.json({ message: "Image supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Supprimer toutes les images
const deleteAllProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });
    if (product.userId !== userId) return res.status(403).json({ message: "Non autorisé" });

    const images = await getImagesByProductId(id);
    for (const img of images) {
      const filePath = path.join(__dirname, "../uploads", img.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.execute("DELETE FROM ProductImage WHERE productId = ?", [id]);
    res.json({ message: "Toutes les images ont été supprimées" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Produits de l'utilisateur
const getMyListings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const [rows] = await db.execute(`
      SELECT p.*, GROUP_CONCAT(pi.url) AS media
      FROM Product p
      LEFT JOIN ProductImage pi ON p.id = pi.productId
      WHERE p.userId = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC`, [userId]);

    const formatted = rows.map((p) => ({
      ...p,
      media: p.media ? p.media.split(",").map(img => `${BASE_URL}/uploads/${img}`) : [],
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Produits favoris
const getUserFavoriteProducts = async (req, res) => {
  try {
    const userId = req.user?.id;
    const [rows] = await db.execute(`
      SELECT p.*, GROUP_CONCAT(pi.url) AS media
      FROM Favorite f
      JOIN Product p ON p.id = f.product_id
      LEFT JOIN ProductImage pi ON p.id = pi.productId
      WHERE f.userId = ?
      GROUP BY p.id
      ORDER BY f.created_at DESC`, [userId]);

    const formatted = rows.map((p) => ({
      ...p,
      media: p.media ? p.media.split(',').map(img => `${BASE_URL}/uploads/${img}`) : [],
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Erreur favoris", error: error.message });
  }
};

module.exports = {
  addProduct,
  listProducts,
  getOneProduct,
  deleteProduct,
  updateProduct,
  markProductAsSold,
  updateProductStatus,
  deleteProductImage,
  deleteAllProductImages,
  getAllProducts,
  getMyListings,
  getUserFavoriteProducts,
};
