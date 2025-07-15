const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const PostModel = require('../models/posts.model');

// ✅ Créer un post (texte obligatoire, images facultatives)
router.post('/', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { text } = req.body;
    const images = req.files?.map(file => file.filename) || [];

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Le contenu du post est requis.' });
    }

    const postId = await PostModel.createPost(userId, text);

    if (images.length > 0) {
      await PostModel.insertPostImages(postId, images);
    }

    return res.status(201).json({
      message: 'Post publié avec succès.',
      postId,
    });
  } catch (err) {
    console.error('❌ Erreur lors de la création du post :', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Récupérer tous les posts (auth facultative)
router.get('/', verifyToken.optional, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null;
    const posts = await PostModel.getAllPosts(userId);
    return res.status(200).json(posts);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération des posts :', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Récupérer un post par ID
router.get('/:id', verifyToken.optional, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.id || req.user?.userId || null;

    const post = await PostModel.getPostById(postId, userId);

    if (!post) {
      return res.status(404).json({ message: 'Post non trouvé.' });
    }

    return res.status(200).json(post);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération du post :', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Modifier un post (texte uniquement)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Le texte est requis.' });
    }

    const updated = await PostModel.updatePost(postId, userId, text);
    if (!updated) return res.status(403).json({ message: 'Modification refusée.' });

    return res.status(200).json({ message: 'Post modifié avec succès.' });
  } catch (err) {
    console.error('❌ Erreur modification post :', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Supprimer un post
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.id;

    const deleted = await PostModel.deletePostByUser(postId, userId);
    if (!deleted) return res.status(403).json({ message: 'Suppression refusée.' });

    return res.status(200).json({ message: 'Post supprimé avec succès.' });
  } catch (err) {
    console.error('❌ Erreur suppression post :', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
