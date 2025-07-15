const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Récupérer tous les posts avec infos utilisateur, images, favoris
exports.getAllPosts = async (userId = null) => {
  const posts = await prisma.post.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      user: { select: { id: true, prenom: true, nom: true, avatar: true } },
      images: true,
      favorites: userId ? {
        where: { userId }
      } : false
    }
  });

  return posts.map(post => ({
    postId: post.id,
    text: post.title,
    createdAt: post.created_at,
    views: post.views,
    userId: post.user.id,
    userName: `${post.user.prenom} ${post.user.nom}`,
    avatar: post.user.avatar,
    images: post.images.map(img => img.url),
    isFavorite: userId ? post.favorites.length > 0 : false,
    canContact: userId ? post.user.id !== userId : true,
    canShare: true,
  }));
};

// ✅ Récupérer un seul post + incrémenter les vues
exports.getPostById = async (postId, userId = null) => {
  const id = Number(postId);

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, prenom: true, nom: true, avatar: true } },
      images: true,
      favorites: userId ? {
        where: { userId }
      } : false
    }
  });

  if (!post) return null;

  // ✅ Incrémenter les vues uniquement si le post existe
  await prisma.post.update({
    where: { id },
    data: { views: { increment: 1 } }
  });

  return {
    postId: post.id,
    text: post.title,
    createdAt: post.created_at,
    views: post.views + 1, // Affiche la vue mise à jour
    userId: post.user.id,
    userName: `${post.user.prenom} ${post.user.nom}`,
    avatar: post.user.avatar,
    images: post.images.map(img => img.url),
    isFavorite: userId ? post.favorites.length > 0 : false,
    canContact: userId ? post.user.id !== userId : true,
    canShare: true,
  };
};

// ✅ Créer un post
exports.createPost = async (userId, text) => {
  const newPost = await prisma.post.create({
    data: {
      userId,
      title: text,
      content: text
    }
  });
  return newPost.id;
};

// ✅ Ajouter plusieurs images
exports.insertPostImages = async (postId, imageUrls = []) => {
  if (!imageUrls.length) return;
  await prisma.postImage.createMany({
    data: imageUrls.map(url => ({
      postId,
      url
    }))
  });
};

// ✅ Modifier un post (si c’est le sien)
exports.updatePost = async (postId, userId, newText) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) }
  });

  if (!post || post.userId !== userId) return false;

  await prisma.post.update({
    where: { id: Number(postId) },
    data: {
      title: newText,
      content: newText
    }
  });

  return true;
};

// ✅ Supprimer un post (si c’est le sien)
exports.deletePostByUser = async (postId, userId) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) }
  });

  if (!post || post.userId !== userId) return false;

  await prisma.post.delete({
    where: { id: Number(postId) }
  });

  return true;
};
