const prisma = require('../config/database');
const ctx = require('../services/iaContextService');
const { notifyByRole, notifyUser } = require('../services/notificationService');

const getExportations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, pays, espece, statut, dateDebut, dateFin, clientId } = req.query;
    const where = {};
    if (pays) where.paysDestination = { contains: pays, mode: 'insensitive' };
    if (espece) where.espece = { contains: espece, mode: 'insensitive' };
    if (statut) where.statut = statut;
    if (dateDebut || dateFin) where.date = {};
    if (dateDebut) where.date.gte = new Date(dateDebut);
    if (dateFin) where.date.lte = new Date(dateFin);
    if (clientId) where.clientId = parseInt(clientId);

    const [exportations, total] = await Promise.all([
      prisma.exportation.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, nom: true, prenom: true } },
          client: { select: { id: true, nom: true, type: true } },
          stock: { select: { id: true, espece: true, unite: true } }
        }
      }),
      prisma.exportation.count({ where })
    ]);

    res.json({
      exportations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) { next(error); }
};

const createExportation = async (req, res, next) => {
  try {
    const { espece, quantite, paysDestination, prixTotal, stockId, clientId } = req.body;
    if (!espece || !quantite || !paysDestination || !prixTotal) {
      return res.status(400).json({ error: 'Champs obligatoires: espece, quantite, paysDestination, prixTotal' });
    }

    const exportation = await prisma.exportation.create({
      data: {
        userId: req.user.id,
        stockId: stockId ? parseInt(stockId) : null,
        clientId: clientId ? parseInt(clientId) : null,
        espece,
        quantite: parseFloat(quantite),
        paysDestination,
        prixTotal: parseFloat(prixTotal),
        statut: 'EN_COURS'
      },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
        client: { select: { id: true, nom: true, type: true } },
        stock: { select: { id: true, espece: true, unite: true } }
      }
    });

    // Update client stats if clientId provided
    if (clientId) {
      const client = await prisma.client.findUnique({ where: { id: parseInt(clientId) } });
      if (client) {
        await prisma.client.update({
          where: { id: parseInt(clientId) },
          data: {
            totalAchats: client.totalAchats + parseFloat(prixTotal),
            nbCommandes: client.nbCommandes + 1
          }
        });
      }
    }

    // Decrement stock on export
    if (stockId) {
      const stock = await prisma.stock.findUnique({ where: { id: parseInt(stockId) } });
      if (stock) {
        const newQuantite = Math.max(0, stock.quantite - parseFloat(quantite));
        await prisma.stock.update({
          where: { id: parseInt(stockId) },
          data: {
            quantite: newQuantite,
            alerte: newQuantite <= stock.seuil
          }
        });
      }
    } else {
      const stockMatch = await prisma.stock.findFirst({
        where: { espece, dateSortie: null }
      });
      if (stockMatch) {
        const newQuantite = Math.max(0, stockMatch.quantite - parseFloat(quantite));
        await prisma.stock.update({
          where: { id: stockMatch.id },
          data: {
            quantite: newQuantite,
            alerte: newQuantite <= stockMatch.seuil
          }
        });
      }
    }

    // 🔔 Notification: exportation créée
    const montantFormatted = new Intl.NumberFormat('fr-FR').format(parseFloat(prixTotal));
    await notifyByRole(['ADMIN'], `🌍 Nouvelle exportation: ${quantite} kg de ${espece} vers ${paysDestination} — ${montantFormatted} Ar`, 'success', '/exportations');
    await notifyUser(req.user.id, `🌍 Exportation créée: ${quantite} kg de ${espece} vers ${paysDestination}`, 'success', '/exportations');

    ctx.invalidateAll();
    res.status(201).json(exportation);
  } catch (error) { next(error); }
};

const getExportationById = async (req, res, next) => {
  try {
    const exportation = await prisma.exportation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
        client: { select: { id: true, nom: true, type: true } },
        stock: { select: { id: true, espece: true, unite: true } }
      }
    });
    if (!exportation) return res.status(404).json({ error: 'Exportation non trouvée' });
    res.json(exportation);
  } catch (error) { next(error); }
};

const updateExportationStatut = async (req, res, next) => {
  try {
    const { statut } = req.body;
    if (!statut) return res.status(400).json({ error: 'Champ obligatoire: statut' });

    const exportation = await prisma.exportation.update({
      where: { id: parseInt(req.params.id) },
      data: { statut },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
        client: { select: { id: true, nom: true, type: true } },
        stock: { select: { id: true, espece: true, unite: true } }
      }
    });
    ctx.invalidateAll();
    res.json(exportation);
  } catch (error) { next(error); }
};

const deleteExportation = async (req, res, next) => {
  try {
    const exportation = await prisma.exportation.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!exportation) return res.status(404).json({ error: 'Exportation non trouvée' });

    // Restore stock on delete
    if (exportation.stockId) {
      const stock = await prisma.stock.findUnique({ where: { id: exportation.stockId } });
      if (stock) {
        await prisma.stock.update({
          where: { id: exportation.stockId },
          data: { quantite: stock.quantite + exportation.quantite }
        });
      }
    }

    // Decrement client stats when exportation is deleted
    if (exportation.clientId) {
      const client = await prisma.client.findUnique({ where: { id: exportation.clientId } });
      if (client) {
        await prisma.client.update({
          where: { id: exportation.clientId },
          data: {
            totalAchats: Math.max(0, client.totalAchats - exportation.prixTotal),
            nbCommandes: Math.max(0, client.nbCommandes - 1)
          }
        });
      }
    }

    await prisma.exportation.delete({ where: { id: parseInt(req.params.id) } });
    ctx.invalidateAll();
    res.status(204).send();
  } catch (error) { next(error); }
};

module.exports = { getExportations, createExportation, getExportationById, updateExportationStatut, deleteExportation };
