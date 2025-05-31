require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('./config/db'); // Connexion à MySQL

const app = express();

// 🔐 Sécurité HTTP
app.use(helmet());

// 🌐 Middleware globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔍 Logger de requêtes
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.originalUrl}`);
  next();
});

// 📁 Fichiers statiques (ex: /uploads/avatars/image.png)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔀 Routes API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes')); // ✅ assure-toi que le nom est correct
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/categories', require('./routes/category.routes'));

// 🧪 Route test (ping)
app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenue sur le backend Jokere 🚀' });
});

// ❌ Middleware 404 : à placer après toutes les routes
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée ❌" });
});

// ❌ Middleware global de gestion d’erreurs internes
app.use((err, req, res, next) => {
  console.error("❌ Erreur non capturée :", err.stack);
  res.status(500).json({ message: "Erreur interne serveur", error: err.message });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
