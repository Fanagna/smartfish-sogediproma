const bateauService = require('../services/bateauService');
const ctx = require('../services/iaContextService');

const getBateaux = async (req, res, next) => {
  try {
    const bateaux = await bateauService.getAllBateaux();
    res.json(bateaux);
  } catch (error) {
    next(error);
  }
};

const getBateauById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bateau = await bateauService.getBateauById(id);

    if (!bateau) {
      return res.status(404).json({ error: 'Bateau non trouvé' });
    }

    res.json(bateau);
  } catch (error) {
    next(error);
  }
};

const createBateau = async (req, res, next) => {
  try {
    const bateau = await bateauService.createBateau(req.body);
    ctx.invalidateAll();
    res.status(201).json(bateau);
  } catch (error) {
    next(error);
  }
};

const updateBateau = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bateau = await bateauService.updateBateau(id, req.body);
    ctx.invalidateAll();
    res.json(bateau);
  } catch (error) {
    next(error);
  }
};

const deleteBateau = async (req, res, next) => {
  try {
    const { id } = req.params;
    await bateauService.deleteBateau(id);
    ctx.invalidateAll();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const utiliserCarburant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantite } = req.body;
    const bateau = await bateauService.utiliserCarburant(id, quantite);
    ctx.invalidateAll();
    res.json(bateau);
  } catch (error) {
    next(error);
  }
};

const remplirCarburant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantite } = req.body;
    const bateau = await bateauService.remplirCarburant(id, quantite);
    ctx.invalidateAll();
    res.json(bateau);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBateaux,
  getBateauById,
  createBateau,
  updateBateau,
  deleteBateau,
  utiliserCarburant,
  remplirCarburant
};
