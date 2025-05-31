const express = require('express');
const router = express.Router();

const {
  addProduct,
  listProducts,
  getOneProduct,
  deleteProduct,
  updateProduct,
  deleteProductImage,
  deleteAllProductImages,
  markProductAsSold,
} = require('../controllers/product.controller');

const verifyToken = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// 🟢 Routes publiques
router.get('/', listProducts);              // Lister les produits avec pagination/recherche
router.get('/:id', getOneProduct);          // Voir un produit spécifique

// 🔐 Routes protégées (utilisateur connecté requis)
router.post('/', verifyToken, upload.array('images', 5), addProduct);     // Créer un produit
router.put('/:id', verifyToken, upload.array('images', 5), updateProduct); // Modifier un produit
router.delete('/:id', verifyToken, deleteProduct);                         // Supprimer un produit
router.delete('/image/:id', verifyToken, deleteProductImage);             // Supprimer une image spécifique
router.delete('/images/:id', verifyToken, deleteAllProductImages);        // Supprimer toutes les images
router.patch('/:id/mark-sold', verifyToken, markProductAsSold);           // Marquer comme vendu

module.exports = router;
