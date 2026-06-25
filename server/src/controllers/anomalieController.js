const prisma = require('../config/database');
const { notifyByRole } = require('../services/notificationService');

const getAnomalies = async (req, res, next) => {
  try {
    const { statut, urgence, type, dateDebut, dateFin } = req.query;

    const where = {};
    if (statut) where.statut = statut;
    if (urgence) where.urgence = urgence;
    if (type) where.type = type;
    if (dateDebut) where.date = { ...where.date, gte: new Date(dateDebut) };
    if (dateFin) where.date = { ...where.date, lte: new Date(dateFin) };

    const anomalies = await prisma.anomalie.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true } }
      }
    });

    res.json(anomalies);
  } catch (error) {
    next(error);
  }
};

const updateAnomalie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['EN_ATTENTE', 'EN_COURS', 'TRAITE'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const anomalie = await prisma.anomalie.update({
      where: { id: parseInt(id) },
      data: { statut },
      include: {
        user: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // 🔔 Notification si anomalie critique ou haute urgence
    if (['CRITIQUE', 'HAUTE'].includes(anomalie.urgence)) {
      await notifyByRole(
        ['ADMIN', 'CAPITAINE'],
        `🚨 Anomalie ${anomalie.urgence}: ${anomalie.description}`,
        anomalie.urgence === 'CRITIQUE' ? 'error' : 'warning',
        '/anomalies'
      );
    }

    res.json(anomalie);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnomalies, updateAnomalie };
