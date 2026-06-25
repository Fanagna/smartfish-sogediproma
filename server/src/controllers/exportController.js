const prisma = require('../config/database');

const getExportStats = async (req, res, next) => {
  try {
    const now = new Date();
    const date30jAgo = new Date(now);
    date30jAgo.setDate(date30jAgo.getDate() - 30);
    const date90jAgo = new Date(now);
    date90jAgo.setDate(date90jAgo.getDate() - 90);
    const date365jAgo = new Date(now);
    date365jAgo.setDate(date365jAgo.getDate() - 365);

    const [
      exportations30j,
      exportations90j,
      exportationsAnnuel,
      exportationsAll,
      ventes30j
    ] = await Promise.all([
      prisma.exportation.findMany({
        where: { date: { gte: date30jAgo } },
        orderBy: { date: 'desc' },
        include: { stock: { select: { espece: true } }, user: { select: { nom: true, prenom: true } } }
      }),
      prisma.exportation.findMany({
        where: { date: { gte: date90jAgo } },
        select: { date: true, espece: true, quantite: true, prixTotal: true, paysDestination: true }
      }),
      prisma.exportation.findMany({
        where: { date: { gte: date365jAgo } },
        select: { date: true, prixTotal: true, paysDestination: true }
      }),
      prisma.exportation.findMany({
        select: { paysDestination: true, prixTotal: true, quantite: true }
      }),
      prisma.vente.findMany({
        where: { date: { gte: date30jAgo } },
        select: { total: true }
      })
    ]);

    // --- KPIs ---
    const totalCAExport30j = exportations30j.reduce((s, e) => s + e.prixTotal, 0);
    const totalQuantiteExport30j = exportations30j.reduce((s, e) => s + e.quantite, 0);
    const nombreExport30j = exportations30j.length;
    const totalCAVentes30j = ventes30j.reduce((s, v) => s + v.total, 0);
    const partExport = (totalCAVentes30j + totalCAExport30j) > 0
      ? parseFloat(((totalCAExport30j / (totalCAVentes30j + totalCAExport30j)) * 100).toFixed(1))
      : 0;
    const nbPays30j = new Set(exportations30j.map(e => e.paysDestination)).size;

    // --- Revenus par pays (30j) ---
    const revenusParPays = {};
    exportations30j.forEach(e => {
      if (!revenusParPays[e.paysDestination]) {
        revenusParPays[e.paysDestination] = { pays: e.paysDestination, total: 0, quantite: 0, nbExport: 0 };
      }
      revenusParPays[e.paysDestination].total += e.prixTotal;
      revenusParPays[e.paysDestination].quantite += e.quantite;
      revenusParPays[e.paysDestination].nbExport += 1;
    });

    // --- Revenus par espèce exportée ---
    const revenusParEspece = {};
    exportations30j.forEach(e => {
      const espece = e.stock?.espece || e.espece || 'Inconnue';
      if (!revenusParEspece[espece]) {
        revenusParEspece[espece] = { espece, total: 0, quantite: 0, nbExport: 0 };
      }
      revenusParEspece[espece].total += e.prixTotal;
      revenusParEspece[espece].quantite += e.quantite;
      revenusParEspece[espece].nbExport += 1;
    });

    // --- Évolution mensuelle (90j) ---
    const evolutionMensuelle = {};
    exportations90j.forEach(e => {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
      if (!evolutionMensuelle[key]) evolutionMensuelle[key] = { mois: key, total: 0, quantite: 0 };
      evolutionMensuelle[key].total += e.prixTotal;
      evolutionMensuelle[key].quantite += e.quantite;
    });

    // --- Évolution annuelle ---
    const evolutionAnnuelle = {};
    exportationsAnnuel.forEach(e => {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
      if (!evolutionAnnuelle[key]) evolutionAnnuelle[key] = { mois: key, total: 0 };
      evolutionAnnuelle[key].total += e.prixTotal;
    });

    // --- Tendances CA journalières (14 derniers jours) pour sparklines réelles ---
    const tendanceCA = {};
    const date14jAgo = new Date(now);
    date14jAgo.setDate(date14jAgo.getDate() - 14);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      tendanceCA[key] = { date: key, total: 0 };
    }
    exportations30j.forEach(e => {
      const key = e.date.toISOString().split('T')[0];
      if (tendanceCA[key]) {
        tendanceCA[key].total += e.prixTotal;
      }
    });

    // --- Tendances quantité journalières (14 derniers jours) ---
    const tendanceQuantite = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      tendanceQuantite[key] = { date: key, total: 0 };
    }
    exportations30j.forEach(e => {
      const key = e.date.toISOString().split('T')[0];
      if (tendanceQuantite[key]) {
        tendanceQuantite[key].total += e.quantite;
      }
    });

    // --- Top destinations historiques ---
    const topDestinations = {};
    exportationsAll.forEach(e => {
      if (!topDestinations[e.paysDestination]) {
        topDestinations[e.paysDestination] = { pays: e.paysDestination, total: 0, quantite: 0 };
      }
      topDestinations[e.paysDestination].total += e.prixTotal;
      topDestinations[e.paysDestination].quantite += e.quantite;
    });

    // --- Prévisions export (moyenne mobile 3 mois) ---
    const moisData = Object.values(evolutionAnnuelle).sort((a, b) => a.mois.localeCompare(b.mois));
    const derniersMois = moisData.slice(-3);
    const moyenneMobile = derniersMois.length > 0
      ? derniersMois.reduce((s, m) => s + m.total, 0) / derniersMois.length
      : 0;

    // --- Répartition géographique (pour carte) ---
    const repartitionGeographique = Object.values(revenusParPays)
      .sort((a, b) => b.total - a.total);

    // --- Dernières exportations ---
    const dernieresExportations = exportations30j.slice(0, 10).map(e => ({
      id: e.id,
      date: e.date,
      espece: e.stock?.espece || e.espece || 'Inconnue',
      quantite: e.quantite,
      prixTotal: e.prixTotal,
      paysDestination: e.paysDestination,
      utilisateur: e.user ? `${e.user.prenom} ${e.user.nom}` : '—'
    }));

    res.json({
      // KPIs
      totalCAExport30j,
      totalQuantiteExport30j,
      nombreExport30j,
      nbPays30j,
      partExport,
      totalCAVentes30j,

      // Détails
      revenusParPays: Object.values(revenusParPays).sort((a, b) => b.total - a.total),
      revenusParEspece: Object.values(revenusParEspece).sort((a, b) => b.total - a.total),
      repartitionGeographique,
      evolutionMensuelle: Object.values(evolutionMensuelle).sort((a, b) => a.mois.localeCompare(b.mois)),
      evolutionAnnuelle: Object.values(evolutionAnnuelle).sort((a, b) => a.mois.localeCompare(b.mois)),
      topDestinationsHistorique: Object.values(topDestinations).sort((a, b) => b.total - a.total).slice(0, 15),

      // Prévisions
      previsions: {
        moisProchain: {
          mois: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`,
          totalEstime: parseFloat(moyenneMobile.toFixed(2)),
        },
        moyenneMobile: parseFloat(moyenneMobile.toFixed(2)),
      },

      // Tendances (données réelles pour sparklines)
      tendanceCA: Object.values(tendanceCA).sort((a, b) => a.date.localeCompare(b.date)),
      tendanceQuantite: Object.values(tendanceQuantite).sort((a, b) => a.date.localeCompare(b.date)),

      // Dernières exportations (feed)
      dernieresExportations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExportStats };
