const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const {
  addFavorite,
  removePostFavorite,
  removeProductFavorite,
  getUserFavorites,
  removeFavoriteById,
  checkFavorite // ✅ nouvelle fonction importée
} = require('../controllers/favorites.controller');

// ✅ Ajouter un favori (soit un postId, soit un productId dans le body)
router.post('/', verifyToken, addFavorite);

// ✅ Obtenir tous les favoris de l’utilisateur connecté
router.get('/', verifyToken, getUserFavorites);

// ✅ Vérifier si un favori existe déjà (GET /api/favorites/check?productId=... ou ?postId=...)
router.get('/check', verifyToken, checkFavorite); // ✅ nouvelle route

// ✅ Supprimer un favori par productId
router.delete('/product/:productId', verifyToken, removeProductFavorite);

// ✅ Supprimer un favori par postId
router.delete('/post/:postId', verifyToken, removePostFavorite);

// ✅ Supprimer un favori par son ID unique (optionnel)
router.delete('/:id', verifyToken, removeFavoriteById);

module.exports = router;
