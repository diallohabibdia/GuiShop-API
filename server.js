require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');

require('./config/db'); // ✅ Connexion à MySQL

const app = express();

// 🔐 Sécurité HTTP
app.use(helmet());

// 🌐 Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🪵 Logger de requêtes
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.originalUrl}`);
  next();
});

// 📁 Fichiers statiques (images, avatars, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📦 Import des routes principales
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/posts', require('./routes/posts.routes'));
app.use('/api/favorites', require('./routes/favorites.routes'));
app.use('/api/status', require('./routes/status.routes')); // ✅ Route de vérification système

// ✅ Route test API
app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenue sur le backend GuiShop 🚀' });
});

// ❌ Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée ❌' });
});

// ❗ Gestion globale des erreurs
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Erreur Multer : ${err.message}` });
  }

  if (err.message && err.message.includes('Format de fichier')) {
    return res.status(400).json({ message: err.message });
  }

  console.error('❌ Erreur non capturée :', err.stack);
  res.status(500).json({
    message: 'Erreur interne serveur',
    error: err.message,
  });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 8082;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur lancé sur http://0.0.0.0:${PORT}`);
});
