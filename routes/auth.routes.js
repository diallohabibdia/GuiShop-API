const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/auth.controller');

const router = express.Router();

// ✅ Route POST /api/auth/register : Inscription utilisateur
router.post(
  '/register',
  [
    body('prenom').notEmpty().withMessage('Le prénom est requis'),
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('telephone').notEmpty().withMessage('Le téléphone est requis'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Les mots de passe ne correspondent pas'),
  ],
  register
);

// ✅ Route POST /api/auth/login : Connexion utilisateur
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  login
);

module.exports = router;
