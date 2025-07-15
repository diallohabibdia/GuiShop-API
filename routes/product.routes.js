const express = require('express');
const { body, validationResult } = require('express-validator');
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
  getMyListings,
  updateProductStatus,
  getUserFavoriteProducts,
} = require('../controllers/product.controller');

const verifyToken = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Middleware pour gérer les erreurs de validation
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Envoie un tableau des erreurs
    return res.status(400).json({ message: 'Validation échouée', errors: errors.array() });
  }
  next();
};

// ------------------------------
// 🟢 Routes publiques
// ------------------------------

// Lister tous les produits avec pagination, filtres, recherche
router.get('/', listProducts);

// Mes annonces (⚠️ doit être avant /:id)
router.get('/my-listings', verifyToken, getMyListings);

// Produits favoris de l'utilisateur
router.get('/favorites', verifyToken, getUserFavoriteProducts);

// Voir un produit en détail
router.get('/:id', getOneProduct);

// ------------------------------
// 🔐 Routes protégées (connexion requise)
// ------------------------------

// Ajouter un produit
router.post(
  '/',
  verifyToken,
  upload.array('images', 5),
  [
    body('title').notEmpty().withMessage('Le titre est requis'),
    body('description').notEmpty().withMessage('La description est requise'),
    body('price').isFloat({ gt: 0 }).withMessage('Le prix doit être supérieur à 0'),
    body('categoryId').isInt().withMessage('La catégorie est requise'),
  ],
  validateRequest,
  addProduct
);

// Modifier un produit
router.put(
  '/:id',
  verifyToken,
  upload.array('images', 5),
  [
    body('title').optional().notEmpty().withMessage('Le titre ne peut pas être vide'),
    body('description').optional().notEmpty().withMessage('La description ne peut pas être vide'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Le prix doit être positif'),
    body('categoryId').optional().isInt().withMessage('ID de catégorie invalide'),
  ],
  validateRequest,
  updateProduct
);

// Changer le statut d’un produit
router.patch(
  '/:id/status',
  verifyToken,
  [
    body('status')
      .isIn(['actif', 'attente', 'vendu'])
      .withMessage('Statut invalide (valeurs autorisées : actif, attente, vendu)'),
  ],
  validateRequest,
  updateProductStatus
);

// Marquer un produit comme vendu
router.patch('/:id/mark-sold', verifyToken, markProductAsSold);

// Supprimer un produit
router.delete('/:id', verifyToken, deleteProduct);

// Supprimer une image d’un produit
router.delete('/image/:id', verifyToken, deleteProductImage);

// Supprimer toutes les images d’un produit
router.delete('/images/:id', verifyToken, deleteAllProductImages);

module.exports = router;
