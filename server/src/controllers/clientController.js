const prisma = require('../config/database');
const ctx = require('../services/iaContextService');

const getClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, type, sort } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (type) where.type = type;

    let orderBy = { createdAt: 'desc' };
    if (sort === 'totalAchats') orderBy = { totalAchats: 'desc' };
    if (sort === 'nbCommandes') orderBy = { nbCommandes: 'desc' };
    if (sort === 'nom') orderBy = { nom: 'asc' };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy,
        include: { user: { select: { id: true, nom: true, prenom: true } } }
      }),
      prisma.client.count({ where })
    ]);

    // Compute dernierAchat for each client (latest transaction date)
    const clientsAvecDernierAchat = await Promise.all(
      clients.map(async (client) => {
        const [derniereVente, derniereExportation, dernierAchat] = await Promise.all([
          prisma.vente.findFirst({
            where: { clientId: client.id },
            orderBy: { date: 'desc' },
            select: { date: true }
          }),
          prisma.exportation.findFirst({
            where: { clientId: client.id },
            orderBy: { date: 'desc' },
            select: { date: true }
          }),
          prisma.achat.findFirst({
            where: { clientId: client.id },
            orderBy: { date: 'desc' },
            select: { date: true }
          })
        ]);

        const dates = [
          derniereVente?.date,
          derniereExportation?.date,
          dernierAchat?.date
        ].filter(Boolean).map(d => new Date(d));

        return {
          ...client,
          dernierAchat: dates.length > 0
            ? dates.sort((a, b) => b - a)[0].toISOString()
            : null
        };
      })
    );

    // Stats
    const stats = await prisma.client.aggregate({
      _sum: { totalAchats: true },
      _count: { _all: true }
    });
    const typesRepartition = await prisma.client.groupBy({
      by: ['type'],
      _count: { _all: true },
      _sum: { totalAchats: true }
    });

    res.json({
      clients: clientsAvecDernierAchat,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      stats: {
        totalClients: stats._count._all || 0,
        totalAchats: stats._sum.totalAchats || 0,
        typesRepartition: typesRepartition.map(t => ({
          type: t.type,
          count: t._count._all,
          totalAchats: t._sum.totalAchats || 0
        }))
      }
    });
  } catch (error) { next(error); }
};

const createClient = async (req, res, next) => {
  try {
    const { nom, email, telephone, adresse, type, notes } = req.body;
    if (!nom || !type) {
      return res.status(400).json({ error: 'Champs obligatoires: nom, type' });
    }

    const client = await prisma.client.create({
      data: {
        userId: req.user.id,
        nom,
        email: email || null,
        telephone: telephone || null,
        adresse: adresse || null,
        type,
        notes: notes || null
      },
      include: { user: { select: { id: true, nom: true, prenom: true } } }
    });

    ctx.invalidateAll();
    res.status(201).json(client);
  } catch (error) { next(error); }
};

const getClientById = async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: { select: { id: true, nom: true, prenom: true } } }
    });
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });
    res.json(client);
  } catch (error) { next(error); }
};

const updateClient = async (req, res, next) => {
  try {
    const { nom, email, telephone, adresse, type, notes } = req.body;
    const data = {};
    if (nom) data.nom = nom;
    if (email !== undefined) data.email = email;
    if (telephone !== undefined) data.telephone = telephone;
    if (adresse !== undefined) data.adresse = adresse;
    if (type) data.type = type;
    if (notes !== undefined) data.notes = notes;

    const client = await prisma.client.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { user: { select: { id: true, nom: true, prenom: true } } }
    });
    ctx.invalidateAll();
    res.json(client);
  } catch (error) { next(error); }
};

const deleteClient = async (req, res, next) => {
  try {
    await prisma.client.delete({ where: { id: parseInt(req.params.id) } });
    ctx.invalidateAll();
    res.status(204).send();
  } catch (error) { next(error); }
};

module.exports = { getClients, createClient, getClientById, updateClient, deleteClient };
