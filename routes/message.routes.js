const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessagesForUser,
  getMessagesWithUser, // ✅ Nouveau
} = require('../controllers/message.controller');
const verifyToken = require('../middleware/auth.middleware');

// ✅ Envoyer un message
router.post('/', verifyToken, sendMessage);

// ✅ Voir tous les messages reçus/envoyés
router.get('/', verifyToken, getMessagesForUser);

// ✅ Voir conversation avec un utilisateur spécifique
router.get('/:receiverId', verifyToken, getMessagesWithUser); // 🔥 C’est celui que tu utilisais dans Postman

module.exports = router;
