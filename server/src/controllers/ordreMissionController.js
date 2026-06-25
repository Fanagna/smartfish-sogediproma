const prisma = require('../config/database');
const ctx = require('../services/iaContextService');

const getOrdresMission = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { bateauNom: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
        { chefMission: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [ordres, total] = await Promise.all([
      prisma.ordreMission.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, nom: true, prenom: true } }
        }
      }),
      prisma.ordreMission.count({ where })
    ]);

    res.json({
      ordres,
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

const getOrdreMissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ordre = await prisma.ordreMission.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, nom: true, prenom: true } }
      }
    });

    if (!ordre) {
      return res.status(404).json({ error: 'Ordre de mission non trouvé' });
    }

    res.json(ordre);
  } catch (error) {
    next(error);
  }
};

const createOrdreMission = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = { ...req.body, userId };

    // Calculs automatiques
    if (data.carburantRestant != null && data.carburantRemplissage != null) {
      data.carburantDepart = data.carburantRestant + data.carburantRemplissage;
    }
    if (data.carburantDepart != null && data.carburantArrivee != null) {
      data.carburantConsommation = data.carburantDepart - data.carburantArrivee;
    }

    // Calcul indemnités totales pour chaque membre d'équipage
    if (Array.isArray(data.equipage)) {
      data.equipage = data.equipage.map(m => ({
        ...m,
        total: (m.montantUnitaire || 0) * (m.nombreJours || 0)
      }));
    }

    const ordre = await prisma.ordreMission.create({
      data: {
        userId: data.userId,
        numero: data.numero,
        date: data.date ? new Date(data.date) : new Date(),
        bateauNom: data.bateauNom,
        bateauType: data.bateauType,
        objetMission: data.objetMission,
        destination: data.destination,
        chefMission: data.chefMission,
        capitaine: data.capitaine,
        equipage: data.equipage || [],
        dateDepart: new Date(data.dateDepart),
        dateArrivee: new Date(data.dateArrivee),
        heureDepart: data.heureDepart,
        heureArrivee: data.heureArrivee,
        vidangeDate: data.vidangeDate ? new Date(data.vidangeDate) : null,
        vidangeTotal: data.vidangeTotal ?? null,
        vidangeProchaine: data.vidangeProchaine ?? null,
        carburantRestant: data.carburantRestant ?? null,
        carburantRemplissage: data.carburantRemplissage ?? null,
        carburantDepart: data.carburantDepart ?? null,
        carburantConsommation: data.carburantConsommation ?? null,
        carburantArrivee: data.carburantArrivee ?? null,
        marchandises: data.marchandises || [],
        passagers: data.passagers || [],
        diversFrais: data.diversFrais || []
      },
      include: {
        user: { select: { id: true, nom: true, prenom: true } }
      }
    });

    ctx.invalidateAll();
    res.status(201).json(ordre);
  } catch (error) {
    next(error);
  }
};

const updateOrdreMission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // Calculs automatiques
    if (data.carburantRestant != null && data.carburantRemplissage != null) {
      data.carburantDepart = data.carburantRestant + data.carburantRemplissage;
    }
    if (data.carburantDepart != null && data.carburantArrivee != null) {
      data.carburantConsommation = data.carburantDepart - data.carburantArrivee;
    }

    if (Array.isArray(data.equipage)) {
      data.equipage = data.equipage.map(m => ({
        ...m,
        total: (m.montantUnitaire || 0) * (m.nombreJours || 0)
      }));
    }

    // Convertir les dates si présentes
    if (data.date) data.date = new Date(data.date);
    if (data.dateDepart) data.dateDepart = new Date(data.dateDepart);
    if (data.dateArrivee) data.dateArrivee = new Date(data.dateArrivee);
    if (data.vidangeDate) data.vidangeDate = new Date(data.vidangeDate);

    const ordre = await prisma.ordreMission.update({
      where: { id: parseInt(id) },
      data,
      include: {
        user: { select: { id: true, nom: true, prenom: true } }
      }
    });

    ctx.invalidateAll();
    res.json(ordre);
  } catch (error) {
    next(error);
  }
};

const deleteOrdreMission = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.ordreMission.delete({
      where: { id: parseInt(id) }
    });
    ctx.invalidateAll();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrdresMission,
  getOrdreMissionById,
  createOrdreMission,
  updateOrdreMission,
  deleteOrdreMission
};
