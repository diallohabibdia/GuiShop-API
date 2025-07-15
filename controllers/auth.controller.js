const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { validationResult } = require('express-validator');

// 🔐 Enregistrement
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Champs invalides',
      errors: errors.array().map(e => e.msg),
    });
  }

  const { prenom, nom, email, telephone, password, confirmPassword } = req.body;

  if (!prenom || !nom || !email || !telephone || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      message: 'Les mots de passe ne correspondent pas',
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({
        message: 'Email déjà utilisé',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        prenom,
        nom,
        email: email.toLowerCase(),
        telephone,
        password: hashedPassword,
        role: 'buyer', // rôle par défaut
      },
    });

    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: newUser.id,
        prenom: newUser.prenom,
        nom: newUser.nom,
        email: newUser.email,
        telephone: newUser.telephone,
        avatar: newUser.avatar || null,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    });
  } catch (err) {
    console.error('❌ Erreur register:', err.message);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// 🔐 Connexion
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Champs invalides',
      errors: errors.array().map(e => e.msg),
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        avatar: user.avatar || null,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('❌ Erreur login:', err.message);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = {
  register,
  login,
};
