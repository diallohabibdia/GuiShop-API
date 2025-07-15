const PostModel = require('../models/posts.model');

// ✅ Créer un nouveau post (texte obligatoire, images facultatives)
exports.createPost = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { text } = req.body;
    const files = req.files || [];

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Le texte est requis.' });
    }

    const postId = await PostModel.createPost(userId, text);

    if (files.length > 0) {
      const imageFilenames = files.map(file => file.filename);
      await PostModel.insertPostImages(postId, imageFilenames);
    }

    return res.status(201).json({
      message: 'Post publié avec succès.',
      postId,
    });
  } catch (err) {
    console.error('❌ Erreur publication post :', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la publication.' });
  }
};

// ✅ Récupérer tous les posts (avec infos utilisateur et images)
exports.getAllPosts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null; // Permet aussi les appels publics
    const posts = await PostModel.getAllPosts(userId);
    return res.status(200).json(posts);
  } catch (err) {
    console.error('❌ Erreur récupération posts :', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des posts.' });
  }
};

// ✅ Récupérer un seul post par son ID
exports.getPostById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null;
    const postId = req.params.id;

    const post = await PostModel.getPostById(postId, userId);

    if (!post) {
      return res.status(404).json({ message: 'Post non trouvé.' });
    }

    return res.status(200).json(post);
  } catch (err) {
    console.error('❌ Erreur récupération post unique :', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération du post.' });
  }
};
