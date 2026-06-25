const prisma = require('../config/database');
const ctx = require('../services/iaContextService');
const { notifyByRole } = require('../services/notificationService');

const verifierAlerte = (stock) => {
  const alerte = stock.quantite <= stock.seuil;
  return { ...stock, alerte };
};

const getStocks = async (req, res, next) => {
  try {
    const { bateauId } = req.query;

    const where = {
      dateSortie: null
    };
    if (bateauId) {
      where.bateauId = parseInt(bateauId);
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        bateau: { select: { id: true, nom: true } }
      }
    });

    const stocksAvecAlerte = stocks.map(verifierAlerte);

    res.json(stocksAvecAlerte);
  } catch (error) {
    next(error);
  }
};

const getStockById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let stock = await prisma.stock.findUnique({
      where: { id: parseInt(id) },
      include: {
        bateau: { select: { id: true, nom: true } },
        capture: true
      }
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock non trouvé' });
    }

    stock = verifierAlerte(stock);

    res.json(stock);
  } catch (error) {
    next(error);
  }
};

const createStock = async (req, res, next) => {
  try {
    const { bateauId, captureId, espece, quantite, unite, seuil, prixVente } = req.body;

    let stock = await prisma.stock.create({
      data: {
        bateauId,
        captureId,
        espece,
        quantite,
        unite,
        seuil: seuil || 50.0,
        prixVente: prixVente ? parseFloat(prixVente) : 0
      },
      include: {
        bateau: { select: { id: true, nom: true } }
      }
    });

    stock = verifierAlerte(stock);

    ctx.invalidateAll();
    res.status(201).json(stock);
  } catch (error) {
    next(error);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    let stock = await prisma.stock.update({
      where: { id: parseInt(id) },
      data: req.body,
      include: {
        bateau: { select: { id: true, nom: true } }
      }
    });

    stock = verifierAlerte(stock);

    // 🔔 Notification si stock en dessous du seuil
    if (stock.alerte) {
      await notifyByRole(
        ['ADMIN', 'CAPITAINE'],
        `⚠️ Stock bas: ${stock.espece} — ${stock.quantite} ${stock.unite} restants (seuil: ${stock.seuil})`,
        'warning',
        '/stocks'
      );
    }

    ctx.invalidateAll();
    res.json(stock);
  } catch (error) {
    next(error);
  }
};

const updateSeuils = async (req, res, next) => {
  try {
    const { seuils } = req.body;

    const updatedStocks = [];
    for (const { id, seuil } of seuils) {
      const stock = await prisma.stock.update({
        where: { id: parseInt(id) },
        data: { seuil },
        include: {
          bateau: { select: { id: true, nom: true } }
        }
      });
      updatedStocks.push(verifierAlerte(stock));
    }

    ctx.invalidateAll();
    res.json(updatedStocks);
  } catch (error) {
    next(error);
  }
};

const deleteStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.stock.update({
      where: { id: parseInt(id) },
      data: { dateSortie: new Date() }
    });

    ctx.invalidateAll();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStocks,
  getStockById,
  createStock,
  updateStock,
  updateSeuils,
  deleteStock
};
