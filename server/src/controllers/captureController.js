const prisma = require('../config/database');
const ctx = require('../services/iaContextService');

const getCaptures = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, dateDebut, dateFin, espece, bateauId, userId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (dateDebut) {
      where.date = { ...where.date, gte: new Date(dateDebut) };
    }
    if (dateFin) {
      where.date = { ...where.date, lte: new Date(dateFin) };
    }
    if (espece) {
      where.espece = { contains: espece, mode: 'insensitive' };
    }
    if (bateauId) {
      where.bateauId = parseInt(bateauId);
    }
    if (userId) {
      where.userId = parseInt(userId);
    }

    const [captures, total] = await Promise.all([
      prisma.capture.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          bateau: { select: { id: true, nom: true, immatriculation: true } },
          user: { select: { id: true, nom: true, prenom: true } }
        }
      }),
      prisma.capture.count({ where })
    ]);

    res.json({
      captures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCaptureById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const capture = await prisma.capture.findUnique({
      where: { id: parseInt(id) },
      include: {
        bateau: { select: { id: true, nom: true, immatriculation: true } },
        user: { select: { id: true, nom: true, prenom: true } },
        stocks: true
      }
    });

    if (!capture) {
      return res.status(404).json({ error: 'Capture non trouvée' });
    }

    res.json(capture);
  } catch (error) {
    next(error);
  }
};

const createCapture = async (req, res, next) => {
  try {
    let { bateauId, bateauNom, espece, poids, quantite, zonePeche, profondeur, temperature } = req.body;
    const userId = req.user.id;

    // Si bateauNom est fourni au lieu de bateauId, résoudre le nom
    if (!bateauId && bateauNom) {
      const bateau = await prisma.bateau.findFirst({
        where: {
          OR: [
            { nom: { contains: bateauNom, mode: 'insensitive' } },
            { immatriculation: { contains: bateauNom, mode: 'insensitive' } }
          ]
        }
      });
      if (bateau) {
        bateauId = bateau.id;
      } else {
        return res.status(400).json({ error: `Aucun bateau trouvé avec le nom ou l'immatriculation "${bateauNom}"` });
      }
    }

    if (!bateauId) {
      return res.status(400).json({ error: 'Le champ bateau (nom ou ID) est obligatoire' });
    }

    const capture = await prisma.capture.create({
      data: {
        bateauId,
        userId,
        espece,
        poids,
        quantite,
        zonePeche,
        profondeur,
        temperature
      },
      include: {
        bateau: { select: { id: true, nom: true, immatriculation: true } },
        user: { select: { id: true, nom: true, prenom: true } }
      }
    });

    ctx.invalidateAll();
    res.status(201).json(capture);
  } catch (error) {
    next(error);
  }
};

const updateCapture = async (req, res, next) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Gérer bateauNom → bateauId (même logique que createCapture)
    if (updateData.bateauNom) {
      const bateau = await prisma.bateau.findFirst({
        where: {
          OR: [
            { nom: { contains: updateData.bateauNom, mode: 'insensitive' } },
            { immatriculation: { contains: updateData.bateauNom, mode: 'insensitive' } }
          ]
        }
      });
      if (bateau) {
        updateData.bateauId = bateau.id;
      }
      delete updateData.bateauNom;
    }

    const capture = await prisma.capture.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        bateau: { select: { id: true, nom: true, immatriculation: true } },
        user: { select: { id: true, nom: true, prenom: true } }
      }
    });

    ctx.invalidateAll();
    res.json(capture);
  } catch (error) {
    next(error);
  }
};

const deleteCapture = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.capture.delete({
      where: { id: parseInt(id) }
    });

    ctx.invalidateAll();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getStatsMensuelles = async (req, res, next) => {
  try {
    const captures = await prisma.capture.findMany({
      select: {
        date: true,
        poids: true,
        quantite: true
      }
    });

    const stats = {};
    captures.forEach(capture => {
      const key = `${capture.date.getFullYear()}-${String(capture.date.getMonth() + 1).padStart(2, '0')}`;
      if (!stats[key]) {
        stats[key] = { mois: key, totalPoids: 0, totalQuantite: 0, nombreCaptures: 0 };
      }
      stats[key].totalPoids += capture.poids;
      stats[key].totalQuantite += capture.quantite;
      stats[key].nombreCaptures += 1;
    });

    const statsArray = Object.values(stats).sort((a, b) => a.mois.localeCompare(b.mois));

    res.json(statsArray);
  } catch (error) {
    next(error);
  }
};

const getCapturesStats = async (req, res, next) => {
  try {
    const date30jAgo = new Date();
    date30jAgo.setDate(date30jAgo.getDate() - 30);

    const [
      captures30j,
      totalBateaux,
      stocksActuels,
      anomaliesEnAttente
    ] = await Promise.all([
      prisma.capture.findMany({
        where: { date: { gte: date30jAgo } },
        select: { date: true, espece: true, poids: true, quantite: true }
      }),
      prisma.bateau.count(),
      prisma.stock.findMany({
        where: { dateSortie: null },
        select: { quantite: true, espece: true, unite: true, seuil: true, alerte: true }
      }),
      prisma.anomalie.count({ where: { statut: 'EN_ATTENTE' } })
    ]);

    const capturesParJour = {};
    const repartitionEspece = {};
    let totalQuantite30j = 0;
    let totalPoids30j = 0;

    captures30j.forEach(capture => {
      const dateKey = capture.date.toISOString().split('T')[0];
      if (!capturesParJour[dateKey]) {
        capturesParJour[dateKey] = { date: dateKey, totalPoids: 0, totalQuantite: 0 };
      }
      capturesParJour[dateKey].totalPoids += capture.poids;
      capturesParJour[dateKey].totalQuantite += capture.quantite;

      if (!repartitionEspece[capture.espece]) {
        repartitionEspece[capture.espece] = 0;
      }
      repartitionEspece[capture.espece] += capture.quantite;
      totalQuantite30j += capture.quantite;
      totalPoids30j += capture.poids;
    });

    const capturesParJourArray = Object.values(capturesParJour).sort((a, b) => a.date.localeCompare(b.date));
    const repartitionEspeceArray = Object.entries(repartitionEspece).map(([espece, value]) => ({ espece, value }));

    const stockTotal = stocksActuels.reduce((sum, s) => sum + s.quantite, 0);

    res.json({
      totalCaptures30j: captures30j.length,
      totalQuantite30j,
      totalPoids30j,
      totalBateaux,
      stockTotal,
      stocksActuels,
      anomaliesEnAttente,
      capturesParJour: capturesParJourArray,
      repartitionEspece: repartitionEspeceArray
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCaptures,
  getCaptureById,
  createCapture,
  updateCapture,
  deleteCapture,
  getStatsMensuelles,
  getCapturesStats
};
