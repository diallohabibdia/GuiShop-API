const db = require('../config/db');

const getAllCategories = async () => {
  const [rows] = await db.execute('SELECT id, name, icon FROM categories');
  return rows;
};

const createCategory = async (name, icon) => {
  const [result] = await db.execute(
    'INSERT INTO categories (name, icon) VALUES (?, ?)',
    [name, icon]
  );
  return result;
};

const updateCategoryById = async (id, name, icon) => {
  const [result] = await db.execute(
    'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
    [name, icon, id]
  );
  return result;
};

const deleteCategoryById = async (id) => {
  const [result] = await db.execute(
    'DELETE FROM categories WHERE id = ?',
    [id]
  );
  return result;
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
};
