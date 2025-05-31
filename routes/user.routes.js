const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getPublicProfile,
  getAllUsers,
  getUserAvatar,
  uploadUserAvatar,
  getContactedProducts, // ✅ importée
} = require('../controllers/user.controller');

// 🔒 Middleware d'upload pour les avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ✅ Routes utilisateur
router.get('/', getAllUsers); // Liste de tous les utilisateurs
router.get('/:id', getPublicProfile); // Profil public avec produits
router.get('/:id/avatar', getUserAvatar); // Avatar statique
router.post('/:id/avatar', upload.single('avatar'), uploadUserAvatar); // Upload avatar
router.get('/:id/contacted-products', getContactedProducts); // ✅ Historique des produits contactés

module.exports = router;
