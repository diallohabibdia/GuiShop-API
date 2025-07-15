const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié ❌" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Accès réservé aux administrateurs ❌" });
    }

    next(); // autorisé
  } catch (error) {
    console.error("❌ Erreur isAdmin:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = isAdmin;
