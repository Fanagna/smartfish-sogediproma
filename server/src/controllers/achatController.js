const prisma = require('../config/database');
const ctx = require('../services/iaContextService');

const getAchats = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, fournisseur, espece, dateDebut, dateFin, clientId } = req.query;
    const where = {};
    if (fournisseur) where.fournisseur = { contains: fournisseur, mode: 'insensitive' };
    if (espece) where.espece = { contains: espece, mode: 'insensitive' };
    if (dateDebut || dateFin) where.date = {};
    if (dateDebut) where.date.gte = new Date(dateDebut);
    if (dateFin) where.date.lte = new Date(dateFin);
    if (clientId) where.clientId = parseInt(clientId);

    const [achats, total] = await Promise.all([
      prisma.achat.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, nom: true, prenom: true } },
          client: { select: { id: true, nom: true, type: true } }
        }
      }),
      prisma.achat.count({ where })
    ]);

    res.json({ achats, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

const createAchat = async (req, res, next) => {
  try {
    const { fournisseur, espece, quantite, prixUnitaire, notes, clientId } = req.body;
    if (!fournisseur || !espece || !quantite || !prixUnitaire) {
      return res.status(400).json({ error: 'Champs obligatoires: fournisseur, espece, quantite, prixUnitaire' });
    }

    const total = parseFloat(quantite) * parseFloat(prixUnitaire);
    const achat = await prisma.achat.create({
      data: {
        userId: req.user.id,
        clientId: clientId ? parseInt(clientId) : null,
        fournisseur,
        espece,
        quantite: parseFloat(quantite),
        prixUnitaire: parseFloat(prixUnitaire),
        total,
        notes: notes || null
      },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
        client: { select: { id: true, nom: true, type: true } }
      }
    });

    // Update client stats if clientId provided
    if (clientId) {
      const client = await prisma.client.findUnique({ where: { id: parseInt(clientId) } });
      if (client) {
        await prisma.client.update({
          where: { id: parseInt(clientId) },
          data: {
            totalAchats: client.totalAchats + total,
            nbCommandes: client.nbCommandes + 1
          }
        });
      }
    }

    // Update stock: find or create stock entry for this species
    const existingStock = await prisma.stock.findFirst({
      where: { espece, dateSortie: null }
    });

    if (existingStock) {
      await prisma.stock.update({
        where: { id: existingStock.id },
        data: { quantite: existingStock.quantite + parseFloat(quantite) }
      });
    } else {
      // Find first available bateau for stock allocation
      const defaultBateau = await prisma.bateau.findFirst({ orderBy: { id: 'asc' }, select: { id: true } });
      if (!defaultBateau) {
        return res.status(400).json({ error: 'Aucun bateau trouvé pour créer le stock. Ajoutez d\'abord un bateau dans la flotte.' });
      }
      await prisma.stock.create({
        data: {
          bateauId: defaultBateau.id,
          espece,
          quantite: parseFloat(quantite),
          unite: 'kg',
          seuil: 50.0
        }
      });
    }

    ctx.invalidateAll();
    res.status(201).json(achat);
  } catch (error) { next(error); }
};

const getAchatById = async (req, res, next) => {
  try {
    const achat = await prisma.achat.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
        client: { select: { id: true, nom: true, type: true } }
      }
    });
    if (!achat) return res.status(404).json({ error: 'Achat non trouvé' });
    res.json(achat);
  } catch (error) { next(error); }
};

const deleteAchat = async (req, res, next) => {
  try {
    const achat = await prisma.achat.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!achat) return res.status(404).json({ error: 'Achat non trouvé' });

    // Decrement client stats when purchase is deleted
    if (achat.clientId) {
      const client = await prisma.client.findUnique({ where: { id: achat.clientId } });
      if (client) {
        await prisma.client.update({
          where: { id: achat.clientId },
          data: {
            totalAchats: Math.max(0, client.totalAchats - achat.total),
            nbCommandes: Math.max(0, client.nbCommandes - 1)
          }
        });
      }
    }

    await prisma.achat.delete({ where: { id: parseInt(req.params.id) } });
    ctx.invalidateAll();
    res.status(204).send();
  } catch (error) { next(error); }
};

const getFournisseurs = async (req, res, next) => {
  try {
    const fournisseurs = await prisma.achat.groupBy({
      by: ['fournisseur'],
      _sum: { total: true, quantite: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } }
    });
    res.json(fournisseurs.map(f => ({
      nom: f.fournisseur,
      totalAchats: f._sum.total || 0,
      totalQuantite: f._sum.quantite || 0,
      nbCommandes: f._count._all
    })));
  } catch (error) { next(error); }
};

module.exports = { getAchats, createAchat, getAchatById, deleteAchat, getFournisseurs };
