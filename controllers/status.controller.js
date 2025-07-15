// controllers/status.controller.js
const prisma = require('../prismaClient');

const getStatus = async (req, res) => {
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];

  const envStatus = requiredEnv.map((key) => ({
    key,
    value: process.env[key] ? '✅ OK' : '❌ Manquant',
  }));

  let dbStatus = '✅ Connexion réussie';

  try {
    await prisma.user.findFirst(); // simple requête de test
  } catch (error) {
    dbStatus = `❌ Erreur DB : ${error.message}`;
  }

  res.json({
    status: '🛠️ Statut du backend',
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 8082,
    database: dbStatus,
    variables: envStatus,
    message:
      dbStatus.startsWith('✅') &&
      envStatus.every((e) => e.value === '✅ OK') &&
      process.env.NODE_ENV === 'production'
        ? '✅ Tout semble prêt pour la production !'
        : '⚠️ Certains éléments doivent être corrigés.',
  });
};

module.exports = {
  getStatus,
};
