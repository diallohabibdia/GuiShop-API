const prisma = require('../prismaClient');

// ✅ Ajouter un favori (postId ou productId)
const addFavorite = async (req, res) => {
  const userId = req.user?.id;
  let { postId, productId } = req.body;

  if (!userId) return res.status(401).json({ message: 'Non autorisé' });

  postId = postId ? parseInt(postId) : null;
  productId = productId ? parseInt(productId) : null;

  if (!postId && !productId) {
    return res.status(400).json({ message: 'postId ou productId requis' });
  }

  try {
    // ✅ Vérifie si le produit existe
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({ message: 'Produit introuvable' });
      }
    }

    // ✅ Vérifie si le post existe
    if (postId) {
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return res.status(404).json({ message: 'Post introuvable' });
      }
    }

    const alreadyFavorited = await prisma.favorite.findFirst({
      where: {
        userId,
        ...(postId && { postId }),
        ...(productId && { productId }),
      },
    });

    if (alreadyFavorited) {
      return res.status(400).json({ message: 'Déjà dans les favoris' });
    }

    const favorite = await prisma.favorite.create({
      data: { userId, postId, productId },
    });

    res.status(201).json({ message: 'Ajouté aux favoris', favorite });
  } catch (error) {
    console.error('❌ Erreur ajout favori :', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer un favori de post
const removePostFavorite = async (req, res) => {
  const userId = req.user?.id;
  const postId = parseInt(req.params.postId);

  if (!userId || isNaN(postId)) {
    return res.status(400).json({ message: 'postId invalide ou manquant' });
  }

  try {
    const deleted = await prisma.favorite.deleteMany({ where: { userId, postId } });

    if (deleted.count === 0) {
      return res.status(404).json({ message: 'Favori non trouvé' });
    }

    res.json({ message: 'Post supprimé des favoris' });
  } catch (error) {
    console.error('❌ Erreur suppression favori post :', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer un favori de produit
const removeProductFavorite = async (req, res) => {
  const userId = req.user?.id;
  const productId = parseInt(req.params.productId);

  if (!userId || isNaN(productId)) {
    return res.status(400).json({ message: 'productId invalide ou manquant' });
  }

  try {
    const deleted = await prisma.favorite.deleteMany({ where: { userId, productId } });

    if (deleted.count === 0) {
      return res.status(404).json({ message: 'Favori non trouvé' });
    }

    res.json({ message: 'Produit supprimé des favoris' });
  } catch (error) {
    console.error('❌ Erreur suppression favori produit :', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Récupérer tous les favoris de l’utilisateur
const getUserFavorites = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Non autorisé' });

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: {
        id: true,
        productId: true,
        postId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
            status: true,
            created_at: true,
            description: true,
            category: {
              select: { id: true, name: true }
            },
            user: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                avatar: true,
              }
            },
            images: {
              select: { id: true, url: true }
            }
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            image: true,
            created_at: true,
            user: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                avatar: true
              }
            },
            images: {
              select: {
                id: true,
                url: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(favorites);
  } catch (error) {
    console.error('❌ Erreur récupération favoris :', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer un favori par ID
const removeFavoriteById = async (req, res) => {
  const userId = req.user?.id;
  const favoriteId = parseInt(req.params.id);

  if (!userId || isNaN(favoriteId)) {
    return res.status(400).json({ message: 'ID invalide ou manquant' });
  }

  try {
    const favorite = await prisma.favorite.findUnique({ where: { id: favoriteId } });

    if (!favorite || favorite.userId !== userId) {
      return res.status(404).json({ message: 'Favori non trouvé ou accès refusé' });
    }

    await prisma.favorite.delete({ where: { id: favoriteId } });

    res.json({ message: 'Favori supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression favori ID :', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Vérifier si un produit ou post est déjà en favori
const checkFavorite = async (req, res) => {
  const userId = req.user?.id;
  const { productId, postId } = req.query;

  if (!userId) return res.status(401).json({ message: 'Non autorisé' });

  try {
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        ...(productId && { productId: parseInt(productId) }),
        ...(postId && { postId: parseInt(postId) }),
      },
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('❌ Erreur vérification favori :', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  addFavorite,
  removePostFavorite,
  removeProductFavorite,
  getUserFavorites,
  removeFavoriteById,
  checkFavorite,
};
