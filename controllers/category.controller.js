const prisma = require('../prismaClient');

// ✅ Lister toutes les catégories (publique)
const listCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error('❌ Erreur listCategories:', error.message);
    res.status(500).json({
      message: 'Erreur lors de la récupération des catégories',
      error: error.message,
    });
  }
};

// ✅ Ajouter une catégorie (admin uniquement)
const addCategory = async (req, res) => {
  const { name, icon } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: "Le nom est requis." });
  }

  try {
    const existing = await prisma.category.findUnique({ where: { name } });

    if (existing) {
      return res.status(409).json({ message: "Cette catégorie existe déjà." });
    }

    const newCategory = await prisma.category.create({
      data: { name, icon },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('❌ Erreur addCategory:', error.message);
    res.status(500).json({
      message: "Erreur lors de l'ajout de la catégorie",
      error: error.message,
    });
  }
};

// ✅ Modifier une catégorie (admin uniquement)
const updateCategory = async (req, res) => {
  const categoryId = parseInt(req.params.id);
  const { name, icon } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: "Le nom est requis." });
  }

  try {
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!existing) {
      return res.status(404).json({ message: "Catégorie introuvable." });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name, icon },
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('❌ Erreur updateCategory:', error.message);
    res.status(500).json({
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
};

// ✅ Supprimer une catégorie (admin uniquement) — avec protection
const deleteCategory = async (req, res) => {
  const categoryId = parseInt(req.params.id);

  try {
    const productsUsingCategory = await prisma.product.count({
      where: { categoryId },
    });

    if (productsUsingCategory > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer : des produits sont liés à cette catégorie.",
      });
    }

    await prisma.category.delete({ where: { id: categoryId } });

    res.status(200).json({ message: "Catégorie supprimée avec succès." });
  } catch (error) {
    console.error('❌ Erreur deleteCategory:', error.message);
    res.status(500).json({
      message: "Erreur lors de la suppression",
      error: error.message,
    });
  }
};

module.exports = {
  listCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};
