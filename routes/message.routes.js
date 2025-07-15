const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  sendMessage,
  getMessagesForUser,
  getMessagesWithUser,
  getMessagesWithUserForProduct,
  getConversations,
} = require('../controllers/message.controller');

const verifyToken = require('../middleware/auth.middleware');

// ✅ Envoyer un message
router.post(
  '/',
  verifyToken,
  [
    body('receiverId').isInt().withMessage('ID du destinataire requis'),
    body('productId').isInt().withMessage('ID du produit requis'),
    body('content').trim().notEmpty().withMessage('Le message ne peut pas être vide'),
  ],
  sendMessage
);

// ✅ Obtenir tous les messages de l’utilisateur connecté (envoyés + reçus)
router.get('/', verifyToken, getMessagesForUser);

// ✅ Obtenir toutes les conversations de l’utilisateur connecté
router.get('/conversations', verifyToken, getConversations);

// ✅ Obtenir tous les messages échangés avec un utilisateur pour un produit donné
router.get('/:receiverId/:productId', verifyToken, getMessagesWithUserForProduct);

// ✅ Obtenir tous les messages échangés avec un utilisateur (tous produits confondus ou via query ?productId=)
router.get('/:receiverId', verifyToken, getMessagesWithUser);

module.exports = router;
