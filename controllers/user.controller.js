const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE_URL = process.env.BASE_URL || "http://localhost:8082";

// 🔧 Utilitaire
const parseId = (val) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? null : parsed;
};

// 🔎 Profil public + produits actifs
const getPublicProfile = async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "ID invalide" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        avatar: true,
        products: {
          where: { status: "actif" },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(user);
  } catch (error) {
    console.error("❌ Erreur getPublicProfile:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 👤 Infos utilisateur de base (id, nom, avatar)
const getBasicUserInfo = async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "ID invalide" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, prenom: true, nom: true, avatar: true },
    });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(user);
  } catch (error) {
    console.error("❌ Erreur getBasicUserInfo:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 👥 Tous les utilisateurs (admin)
const getAllUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error("❌ Erreur getAllUsers:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📤 Avatar public
const getUserAvatar = async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "ID invalide" });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.avatar) return res.status(404).json({ message: "Avatar non trouvé" });

    const filePath = path.resolve(__dirname, "../uploads/avatars", user.avatar);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Fichier introuvable" });

    res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Erreur getUserAvatar:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📥 Upload avatar
const uploadUserAvatar = async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "ID invalide" });

  try {
    const avatarFile = req.file;
    if (!avatarFile) return res.status(400).json({ message: "Fichier avatar manquant" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatar) {
      const oldPath = path.resolve(__dirname, "../uploads/avatars", user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarFile.filename },
    });

    res.json({
      message: "Avatar mis à jour avec succès",
      avatar: updated.avatar,
      url: `${BASE_URL}/uploads/avatars/${updated.avatar}`,
    });
  } catch (error) {
    console.error("❌ Erreur uploadUserAvatar:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📨 Produits contactés (par messages)
const getContactedProducts = async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "ID invalide" });

  try {
    const messages = await prisma.message.findMany({
      where: { senderId: userId },
      distinct: ["productId"],
      select: { product: true },
    });

    const products = messages.map((m) => m.product).filter(Boolean);
    res.json(products);
  } catch (error) {
    console.error("❌ Erreur getContactedProducts:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🔐 Changer mot de passe
const changePassword = async (req, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe actuel incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error("❌ Erreur changePassword:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📝 Mise à jour profil
const updateProfile = async (req, res) => {
  const userId = req.user?.id;
  const { prenom, nom, email, telephone } = req.body;

  if (!prenom || !nom || !email || !telephone) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }

  try {
    const emailUsed = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
    });

    if (emailUsed) {
      return res.status(409).json({ message: "Email déjà utilisé par un autre compte" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { prenom, nom, email, telephone },
      select: { id: true, prenom: true, nom: true, email: true, telephone: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("❌ Erreur updateProfile:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📦 Annonces d’un utilisateur public
const getMyListings = async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "ID invalide" });

  try {
    const products = await prisma.product.findMany({
      where: { userId },
      orderBy: { created_at: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error("❌ Erreur getMyListings:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📦 Annonces personnelles (privées)
const getMyOwnListings = async (req, res) => {
  const userId = req.user?.id;

  try {
    const products = await prisma.product.findMany({
      where: { userId },
      orderBy: { created_at: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error("❌ Erreur getMyOwnListings:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  getPublicProfile,
  getBasicUserInfo,
  getAllUsers,
  getUserAvatar,
  uploadUserAvatar,
  getContactedProducts,
  changePassword,
  updateProfile,
  getMyListings,
  getMyOwnListings,
};
