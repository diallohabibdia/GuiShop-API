const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const {
  getUserById,
  getUserProducts,
  updateUserAvatar,
} = require('../models/user.model');

// ✅ Récupérer un profil utilisateur public avec ses produits actifs
const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const products = await getUserProducts(id);
    user.products = products;

    res.json(user);
  } catch (error) {
    console.error("❌ Erreur getPublicProfile:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Lister tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, name, email, avatar, created_at FROM users'
    );
    res.json(rows);
  } catch (error) {
    console.error("❌ Erreur getAllUsers:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Renvoyer l'avatar
const getUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user || !user.avatar)
      return res.status(404).json({ message: "Avatar non trouvé" });

    const avatarPath = path.resolve(__dirname, '../uploads/avatars', user.avatar);
    if (!fs.existsSync(avatarPath))
      return res.status(404).json({ message: "Fichier introuvable" });

    res.sendFile(avatarPath);
  } catch (error) {
    console.error("❌ Erreur getUserAvatar:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Upload avatar + suppression de l'ancien fichier
const uploadUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const avatarFile = req.file;
    if (!avatarFile)
      return res.status(400).json({ message: "Fichier avatar manquant" });

    const user = await getUserById(id);

    // 🔥 Supprimer l'ancien avatar si existant
    if (user?.avatar) {
      const oldPath = path.resolve(__dirname, '../uploads/avatars', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await updateUserAvatar(id, avatarFile.filename);

    res.json({
      message: "Avatar mis à jour avec succès",
      avatar: avatarFile.filename,
      url: `/uploads/avatars/${avatarFile.filename}`,
    });
  } catch (error) {
    console.error("❌ Erreur uploadUserAvatar:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Produits contactés par un utilisateur (via messages)
const getContactedProducts = async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await db.execute(`
      SELECT DISTINCT p.*
      FROM messages m
      JOIN products p ON m.product_id = p.id
      WHERE m.sender_id = ?
    `, [userId]);

    res.json(rows);
  } catch (error) {
    console.error("❌ Erreur getContactedProducts:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  getPublicProfile,
  getAllUsers,
  getUserAvatar,
  uploadUserAvatar,
  getContactedProducts,
};
