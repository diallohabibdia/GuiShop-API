const db = require('../config/db');
const bcrypt = require('bcrypt');

// ✅ Créer un utilisateur
const createUser = async ({ prenom, nom, email, telephone, password, avatar = null, role = 'buyer' }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    `INSERT INTO User (prenom, nom, email, telephone, password, avatar, role, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [prenom, nom, email, telephone, hashedPassword, avatar, role]
  );
  return result.insertId;
};

// ✅ Vérifier les informations de connexion (email + mot de passe)
const authenticateUser = async (email, password) => {
  const [rows] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
  const user = rows[0];
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
};

// ✅ Vérifier si un email est déjà utilisé
const isEmailTaken = async (email) => {
  const [rows] = await db.query('SELECT id FROM User WHERE email = ?', [email]);
  return rows.length > 0;
};

// ✅ Récupérer un utilisateur par ID
const getUserById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, prenom, nom, email, telephone, avatar, role, createdAt FROM User WHERE id = ?',
    [id]
  );
  return rows[0];
};

// ✅ Récupérer un utilisateur par email (complet, pour login ou info utilisateur)
const getUserByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
  return rows[0];
};

// ✅ Mettre à jour les infos utilisateur
const updateUserProfile = async (id, { prenom, nom, telephone, avatar }) => {
  const [result] = await db.query(
    `UPDATE User 
     SET prenom = ?, nom = ?, telephone = ?, avatar = ? 
     WHERE id = ?`,
    [prenom, nom, telephone, avatar, id]
  );
  return result;
};

// ✅ Mettre à jour le mot de passe
const updatePassword = async (id, newPassword) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  const [result] = await db.query(
    `UPDATE User SET password = ? WHERE id = ?`,
    [hashed, id]
  );
  return result;
};

// ✅ Supprimer un utilisateur
const deleteUser = async (id) => {
  const [result] = await db.query('DELETE FROM User WHERE id = ?', [id]);
  return result;
};

// ✅ Rechercher des utilisateurs par nom ou email
const searchUsers = async (keyword) => {
  const like = `%${keyword}%`;
  const [rows] = await db.query(
    `SELECT id, prenom, nom, email, avatar 
     FROM User 
     WHERE prenom LIKE ? OR nom LIKE ? OR email LIKE ?`,
    [like, like, like]
  );
  return rows;
};

// ✅ Export
module.exports = {
  createUser,
  authenticateUser,
  isEmailTaken,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  updatePassword,
  deleteUser,
  searchUsers,
};
