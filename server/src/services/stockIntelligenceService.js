const prisma = require('../config/database');

const detectRuptureImminente = async () => {
  const date30j = new Date();
  date30j.setDate(date30j.getDate() - 30);

  const stocks = await prisma.stock.findMany({
    where: { dateSortie: null },
    include: { bateau: true }
  });

  const ventes = await prisma.vente.groupBy({
    by: ['espece'],
    where: { date: { gte: date30j } },
    _sum: { quantite: true },
    _count: { _all: true }
  });

  const ventesMap = new Map(ventes.map(v => [v.espece, v._sum.quantite]));

  return stocks.map(stock => {
    const ventes30j = ventesMap.get(stock.espece) || 0;
    const demandeJournaliere = ventes30j / 30;
    const joursRestants = demandeJournaliere > 0 ? stock.quantite / demandeJournaliere : Infinity;
    const ruptureImminente = joursRestants <= 7;

    return {
      stockId: stock.id,
      espece: stock.espece,
      quantiteActuelle: stock.quantite,
      unite: stock.unite,
      seuil: stock.seuil,
      ventes30j,
      demandeJournaliere: demandeJournaliere.toFixed(2),
      joursRestants: joursRestants.toFixed(1),
      ruptureImminente,
      niveauUrgence: ruptureImminente ? (joursRestants <= 3 ? 'CRITIQUE' : 'HAUTE') : 'BASSE'
    };
  }).filter(r => r.ruptureImminente);
};

const detectSurstock = async () => {
  const date90j = new Date();
  date90j.setDate(date90j.getDate() - 90);

  const stocks = await prisma.stock.findMany({
    where: { dateSortie: null },
    include: { bateau: true }
  });

  const ventes = await prisma.vente.groupBy({
    by: ['espece'],
    where: { date: { gte: date90j } },
    _sum: { quantite: true },
    _count: { _all: true }
  });

  const ventesMap = new Map(ventes.map(v => [v.espece, v._sum.quantite]));

  return stocks.map(stock => {
    const ventes90j = ventesMap.get(stock.espece) || 0;
    const moyenneMois = ventes90j / 3;
    const ratio = moyenneMois > 0 ? stock.quantite / moyenneMois : 0;
    const surstock = ratio > 3;

    return {
      stockId: stock.id,
      espece: stock.espece,
      quantiteActuelle: stock.quantite,
      unite: stock.unite,
      ventes90j,
      moyenneMois: moyenneMois.toFixed(2),
      ratio: ratio.toFixed(2),
      surstock,
      recommandation: surstock ? 'Arrêt achat temporaire' : 'OK'
    };
  }).filter(r => r.surstock);
};

const getAnalyseRentabilite = async () => {
  const date30j = new Date();
  date30j.setDate(date30j.getDate() - 30);

  const ventes = await prisma.vente.findMany({
    where: { date: { gte: date30j } },
    include: { stock: true }
  });

  const rentabiliteParEspece = {};

  ventes.forEach(vente => {
    if (!rentabiliteParEspece[vente.espece]) {
      rentabiliteParEspece[vente.espece] = {
        espece: vente.espece,
        totalQuantite: 0,
        totalCA: 0,
        prixMoyenUnitaire: 0,
        nombreVentes: 0
      };
    }

    const entry = rentabiliteParEspece[vente.espece];
    entry.totalQuantite += vente.quantite;
    entry.totalCA += vente.total;
    entry.nombreVentes += 1;
    entry.prixMoyenUnitaire = entry.totalCA / entry.totalQuantite;
  });

  return Object.values(rentabiliteParEspece).sort((a, b) => b.totalCA - a.totalCA);
};

const getRotationIntelligente = async () => {
  const stocks = await prisma.stock.findMany({
    where: { dateSortie: null },
    include: { bateau: true },
    orderBy: { dateEntree: 'asc' }
  });

  return stocks.map(stock => {
    const ageEnJours = Math.floor((new Date() - new Date(stock.dateEntree)) / (1000 * 60 * 60 * 24));
    return {
      stockId: stock.id,
      espece: stock.espece,
      quantite: stock.quantite,
      dateEntree: stock.dateEntree,
      ageEnJours,
      priorite: ageEnJours > 30 ? 'HAUTE' : ageEnJours > 15 ? 'MOYENNE' : 'BASSE',
      action: ageEnJours > 30 ? 'Écouler en priorité (FIFO)' : 'Rotation normale'
    };
  });
};

const getProduitsCritiques = async () => {
  const rupture = await detectRuptureImminente();
  const surstock = await detectSurstock();

  return {
    ruptureImminente: rupture.filter(r => r.niveauUrgence === 'CRITIQUE' || r.niveauUrgence === 'HAUTE'),
    surstockDangereux: surstock.filter(s => parseFloat(s.ratio) > 5),
    totalCritiques: rupture.length + surstock.filter(s => parseFloat(s.ratio) > 5).length
  };
};

module.exports = {
  detectRuptureImminente,
  detectSurstock,
  getAnalyseRentabilite,
  getRotationIntelligente,
  getProduitsCritiques
};
