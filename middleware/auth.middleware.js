const jwt = require('jsonwebtoken');

// ✅ Middleware obligatoire : protège les routes privées
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant ou mal formé.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({ message: 'Token invalide : ID manquant.' });
    }

    req.user = { id: decoded.userId }; // 👈 standardisé pour tous les contrôleurs
    console.log('🔐 Utilisateur authentifié ID :', decoded.userId);

    next();
  } catch (err) {
    console.error('❌ Erreur middleware auth :', err.message);
    return res.status(403).json({ message: 'Token invalide ou expiré.' });
  }
};

// ✅ Middleware facultatif : utilise l'utilisateur si le token est présent, sinon passe
verifyToken.optional = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded?.userId) {
        req.user = { id: decoded.userId };
        console.log('🔓 Utilisateur connecté (facultatif) :', decoded.userId);
      }
    }
  } catch (err) {
    console.warn('⚠️ Token facultatif ignoré :', err.message);
  }

  next(); // Toujours continuer
};

module.exports = verifyToken;
