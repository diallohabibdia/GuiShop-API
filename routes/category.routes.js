const express = require('express');
const router = express.Router();

const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');

const verifyToken = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/isAdmin');

// ✅ Route publique : lister les catégories
router.get('/', listCategories);

// ✅ Routes protégées : admin uniquement
router.post('/', verifyToken, isAdmin, createCategory);
router.put('/:id', verifyToken, isAdmin, updateCategory);
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router;
