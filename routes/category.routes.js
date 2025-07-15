// ✅ category.routes.js
const express = require('express');
const router = express.Router();

// 🔐 Middleware d'authentification et vérification admin
const verifyToken = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/isAdmin');

// 🎯 Contrôleurs des catégories
const {
  listCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');

// ✅ [GET] /api/categories → Lecture publique (liste des catégories)
router.get('/', listCategories);

// ✅ [POST] /api/categories → Ajouter une catégorie (admin uniquement)
router.post('/', verifyToken, isAdmin, addCategory);

// ✅ [PUT] /api/categories/:id → Modifier une catégorie (admin uniquement)
router.put('/:id', verifyToken, isAdmin, updateCategory);

// ✅ [DELETE] /api/categories/:id → Supprimer une catégorie (admin uniquement)
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router;
