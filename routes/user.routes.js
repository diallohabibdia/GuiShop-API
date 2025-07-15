const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/auth.middleware');

const {
  getPublicProfile,
  getAllUsers,
  getUserAvatar,
  uploadUserAvatar,
  getContactedProducts,
  changePassword,
  updateProfile,
  getMyListings,
  getMyOwnListings,
  getBasicUserInfo,
} = require('../controllers/user.controller');

const { getUserById } = require('../models/user.model'); // fonction Prisma

// 📁 Configuration Multer pour avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `avatar-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValidType = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (isValidType) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers JPG, JPEG, PNG sont autorisés.'));
    }
  },
});

// ✅ Récupérer mes infos utilisateur (authentifié)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('❌ Erreur /me :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Annonces de l’utilisateur connecté
router.get('/me/my-listings', verifyToken, getMyOwnListings);

// ✅ Modifier le profil connecté
router.put('/me', verifyToken, updateProfile);

// ✅ Modifier mot de passe
router.put('/change-password', verifyToken, changePassword);

// ✅ Tous les utilisateurs (public ou admin)
router.get('/', getAllUsers);

// ✅ Infos de base d’un utilisateur (nom/avatar)
router.get('/:id/basic', getBasicUserInfo);

// ✅ Annonces publiques d’un utilisateur
router.get('/:id/my-listings', getMyListings);

// ✅ Profil public (avec annonces actives)
router.get('/:id', getPublicProfile);

// ✅ Récupérer avatar
router.get('/:id/avatar', getUserAvatar);

// ✅ Upload avatar (authentifié)
router.post('/:id/avatar', verifyToken, upload.single('avatar'), uploadUserAvatar);

// ✅ Produits contactés par un utilisateur
router.get('/:id/contacted-products', getContactedProducts);

module.exports = router;
