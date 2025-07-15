const { body } = require('express-validator');

// ✅ Validation de l'inscription
exports.registerValidation = [
  body('nom')
    .trim()
    .notEmpty().withMessage("Le nom est requis")
    .isAlpha().withMessage("Le nom ne doit contenir que des lettres"),

  body('prenom')
    .trim()
    .notEmpty().withMessage("Le prénom est requis")
    .isAlpha().withMessage("Le prénom ne doit contenir que des lettres"),

  body('telephone')
    .trim()
    .notEmpty().withMessage("Le numéro de téléphone est requis")
    .matches(/^[0-9]{8,15}$/).withMessage("Numéro de téléphone invalide"),

  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage("Email invalide"),

  body('password')
    .notEmpty().withMessage("Le mot de passe est requis")
    .isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères"),

  body('confirmPassword')
    .notEmpty().withMessage("La confirmation du mot de passe est requise")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Les mots de passe ne correspondent pas"),
];

// ✅ Validation de la connexion
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage("Email invalide"),

  body('password')
    .notEmpty().withMessage("Mot de passe requis"),
];
