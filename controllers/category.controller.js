const {
  getAllCategories,
  createCategory: createCategoryInDB, // 🔁 renommé pour éviter le conflit
  updateCategoryById,
  deleteCategoryById,
} = require('../models/category.model');

// ✅ Lister les catégories
const listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('❌ Erreur listCategories:', error.message);
    res.status(500).json({
      message: 'Erreur lors de la récupération des catégories',
      error: error.message,
    });
  }
};

// ✅ Créer une nouvelle catégorie
const createCategory = async (req, res) => {
  const { name, icon } = req.body;
  if (!name || !icon) {
    return res.status(400).json({ message: 'Champs requis manquants' });
  }

  try {
    await createCategoryInDB(name, icon); // ✅ appelle la fonction renommée
    res.status(201).json({ message: 'Catégorie créée avec succès' });
  } catch (error) {
    console.error('❌ Erreur createCategory:', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Modifier une catégorie existante
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, icon } = req.body;

  try {
    const result = await updateCategoryById(id, name, icon);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    res.json({ message: 'Catégorie mise à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur updateCategory:', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer une catégorie
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteCategoryById(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteCategory:', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
