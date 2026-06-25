const prisma = require('../config/database');
const ctx = require('../services/iaContextService');
const { notifyByRole, notifyUser } = require('../services/notificationService');

const getVentes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, typeClient, espece, dateDebut, dateFin, clientId } = req.query;
    const where = {};
    if (typeClient) where.typeClient = typeClient;
    if (espece) where.espece = { contains: espece, mode: 'insensitive' };
    if (dateDebut || dateFin) where.date = {};
    if (dateDebut) where.date.gte = new Date(dateDebut);
    if (dateFin) where.date.lte = new Date(dateFin);
    if (clientId) where.clientId = parseInt(clientId);

    const [ventes, total, totalCA] = await Promise.all([
      prisma.vente.findMany({
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
      prisma.vente.count({ where }),
      prisma.vente.aggregate({
        where,
        _sum: { total: true }
      })
    ]);

    res.json({
      ventes,
      totalCA: totalCA._sum.total || 0,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) { next(error); }
};

const createVente = async (req, res, next) => {
  try {
    const { espece, quantite, prixUnitaire, typeClient, stockId, clientId } = req.body;
    if (!espece || !quantite || !prixUnitaire || !typeClient) {
      return res.status(400).json({ error: 'Champs obligatoires: espece, quantite, prixUnitaire, typeClient' });
    }

    const total = parseFloat(quantite) * parseFloat(prixUnitaire);

    const vente = await prisma.vente.create({
      data: {
        userId: req.user.id,
        stockId: stockId ? parseInt(stockId) : null,
        clientId: clientId ? parseInt(clientId) : null,
        espece,
        quantite: parseFloat(quantite),
        prixUnitaire: parseFloat(prixUnitaire),
        total,
        typeClient
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
            totalAchats: client.totalAchats + total,
            nbCommandes: client.nbCommandes + 1
          }
        });
      }
    }

    // Update stock in real-time: decrement quantity
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
      // If no specific stockId, decrement the first matching stock
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

    // 🔔 Notification: vente créée
    const montantFormatted = new Intl.NumberFormat('fr-FR').format(total);
    await notifyByRole(['ADMIN'], `💰 Nouvelle vente: ${quantite} kg de ${espece} à ${typeClient} — ${montantFormatted} Ar`, 'success', '/ventes-locales');
    await notifyUser(req.user.id, `💰 Vente enregistrée: ${quantite} kg de ${espece} — ${montantFormatted} Ar`, 'success', '/ventes-locales');

    // Vérifier si le stock est maintenant bas et notifier
    if (stockId) {
      const stockApres = await prisma.stock.findUnique({ where: { id: parseInt(stockId) } });
      if (stockApres && stockApres.alerte) {
        await notifyByRole(['ADMIN', 'CAPITAINE'], `⚠️ Stock bas: ${stockApres.espece} — ${stockApres.quantite} ${stockApres.unite} restants (seuil: ${stockApres.seuil})`, 'warning', '/stocks');
      }
    } else {
      const stockMatch = await prisma.stock.findFirst({ where: { espece, dateSortie: null } });
      if (stockMatch && stockMatch.quantite <= stockMatch.seuil) {
        await notifyByRole(['ADMIN', 'CAPITAINE'], `⚠️ Stock bas: ${stockMatch.espece} — ${stockMatch.quantite} ${stockMatch.unite} restants (seuil: ${stockMatch.seuil})`, 'warning', '/stocks');
      }
    }

    ctx.invalidateAll();
    res.status(201).json(vente);
  } catch (error) { next(error); }
};

const getVenteById = async (req, res, next) => {
  try {
    const vente = await prisma.vente.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
        client: { select: { id: true, nom: true, type: true } },
        stock: { select: { id: true, espece: true, unite: true } }
      }
    });
    if (!vente) return res.status(404).json({ error: 'Vente non trouvée' });
    res.json(vente);
  } catch (error) { next(error); }
};

const deleteVente = async (req, res, next) => {
  try {
    const vente = await prisma.vente.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!vente) return res.status(404).json({ error: 'Vente non trouvée' });

    // Restore stock on delete
    if (vente.stockId) {
      const stock = await prisma.stock.findUnique({ where: { id: vente.stockId } });
      if (stock) {
        await prisma.stock.update({
          where: { id: vente.stockId },
          data: { quantite: stock.quantite + vente.quantite }
        });
      }
    }

    // Decrement client stats when sale is deleted
    if (vente.clientId) {
      const client = await prisma.client.findUnique({ where: { id: vente.clientId } });
      if (client) {
        await prisma.client.update({
          where: { id: vente.clientId },
          data: {
            totalAchats: Math.max(0, client.totalAchats - vente.total),
            nbCommandes: Math.max(0, client.nbCommandes - 1)
          }
        });
      }
    }

    await prisma.vente.delete({ where: { id: parseInt(req.params.id) } });
    ctx.invalidateAll();
    res.status(204).send();
  } catch (error) { next(error); }
};

module.exports = { getVentes, createVente, getVenteById, deleteVente };
