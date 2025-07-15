const prisma = require('../prismaClient');
const { validationResult } = require('express-validator');

// ✅ Envoyer un message
const sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Champs invalides', errors: errors.array().map(e => e.msg) });
  }

  const { receiverId, content, productId } = req.body;
  const senderId = req.user?.id;

  if (!receiverId || !content?.trim() || !productId || !senderId) {
    return res.status(400).json({ message: 'Champs requis manquants : receiverId, content, productId' });
  }

  if (senderId === parseInt(receiverId)) {
    return res.status(400).json({ message: "Vous ne pouvez pas vous envoyer un message à vous-même" });
  }

  try {
    const receiver = await prisma.user.findUnique({ where: { id: parseInt(receiverId) } });
    if (!receiver) return res.status(404).json({ message: "Utilisateur destinataire introuvable" });

    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) return res.status(404).json({ message: "Produit introuvable" });

    let conversation = await prisma.conversation.findFirst({
      where: {
        productId: parseInt(productId),
        OR: [
          { user1Id: senderId, user2Id: parseInt(receiverId) },
          { user1Id: parseInt(receiverId), user2Id: senderId },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: senderId,
          user2Id: parseInt(receiverId),
          productId: parseInt(productId),
        },
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId,
        receiverId: parseInt(receiverId),
        conversationId: conversation.id,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // ✅ Notification "Nouveau message"
    await prisma.notification.create({
      data: {
        userId: parseInt(receiverId),
        type: 'message',
        title: 'Nouveau message',
        body: `Vous avez reçu un message de ${req.user?.prenom || 'un utilisateur'}`,
        icon: '📩',
        targetRoute: `/messages/${senderId}?productId=${productId}`,
        isRead: false,
        createdAt: new Date(),
      },
    });

    res.status(201).json({
      message: 'Message envoyé avec succès',
      data: newMessage,
    });
  } catch (err) {
    console.error('❌ Erreur sendMessage:', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ✅ Toutes les conversations de l'utilisateur connecté
const getConversations = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Non autorisé' });

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        product: {
          select: {
            id: true,
            title: true,
            images: { select: { url: true }, take: 1 },
          },
        },
        user1: { select: { id: true, prenom: true, nom: true, avatar: true } },
        user2: { select: { id: true, prenom: true, nom: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = conversations.map((conv) => {
      const other = conv.user1.id === userId ? conv.user2 : conv.user1;
      return {
        id: conv.id,
        productId: conv.product.id,
        productTitle: conv.product.title,
        productImage: conv.product.images[0]?.url || null,
        lastMessage: conv.messages[0]?.content || null,
        lastDate: conv.messages[0]?.created_at || null,
        participant: {
          id: other.id,
          nom: other.nom,
          prenom: other.prenom,
          avatar: other.avatar || null,
        },
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('❌ Erreur getConversations:', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ✅ Messages entre 2 utilisateurs pour un produit
const getMessagesWithUserForProduct = async (req, res) => {
  const senderId = req.user?.id;
  const receiverId = parseInt(req.params.receiverId);
  const productId = parseInt(req.params.productId);

  if (!senderId || !receiverId || !productId) {
    return res.status(400).json({ message: 'Paramètres requis manquants (receiverId, productId)' });
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        productId,
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });

    if (!conversation) return res.json([]);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { created_at: 'asc' },
    });

    res.json(messages);
  } catch (err) {
    console.error('❌ Erreur getMessagesWithUserForProduct:', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ✅ Version simplifiée sans productId en paramètre
const getMessagesWithUser = async (req, res) => {
  req.params.productId = req.query.productId;
  return getMessagesWithUserForProduct(req, res);
};

// ✅ Tous les messages reçus/envoyés par l'utilisateur
const getMessagesForUser = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Non autorisé" });

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(messages);
  } catch (err) {
    console.error('❌ Erreur getMessagesForUser:', err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessagesWithUserForProduct,
  getMessagesWithUser,
  getMessagesForUser,
};
