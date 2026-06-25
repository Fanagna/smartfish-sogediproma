const prisma = require('../config/database');

const getCommercialStats = async (req, res, next) => {
  try {
    const now = new Date();
    const date30jAgo = new Date(now);
    date30jAgo.setDate(date30jAgo.getDate() - 30);
    const date90jAgo = new Date(now);
    date90jAgo.setDate(date90jAgo.getDate() - 90);
    const date365jAgo = new Date(now);
    date365jAgo.setDate(date365jAgo.getDate() - 365);

    const [
      ventes30j,
      ventes90j,
      ventesAnnuel,
      stocksDisponibles,
      exportations30j
    ] = await Promise.all([
      prisma.vente.findMany({
        where: { date: { gte: date30jAgo } },
        orderBy: { date: 'desc' },
        include: { stock: { select: { espece: true } }, user: { select: { nom: true, prenom: true } } }
      }),
      prisma.vente.findMany({
        where: { date: { gte: date90jAgo } },
        select: { date: true, espece: true, quantite: true, total: true, typeClient: true }
      }),
      prisma.vente.findMany({
        where: { date: { gte: date365jAgo } },
        select: { date: true, total: true }
      }),
      prisma.stock.findMany({
        where: { dateSortie: null },
        select: { espece: true, quantite: true, unite: true }
      }),
      prisma.exportation.findMany({
        where: { date: { gte: date30jAgo } },
        select: { date: true, quantite: true, prixTotal: true, paysDestination: true }
      })
    ]);

    // --- KPIs ---
    const totalCAVentes30j = ventes30j.reduce((s, v) => s + v.total, 0);
    const totalQuantiteVendue30j = ventes30j.reduce((s, v) => s + v.quantite, 0);
    const nombreVentes30j = ventes30j.length;
    const panierMoyen = nombreVentes30j > 0 ? totalCAVentes30j / nombreVentes30j : 0;
    const totalCAExport30j = exportations30j.reduce((s, e) => s + e.prixTotal, 0);
    const ratioLocalExport = totalCAVentes30j + totalCAExport30j > 0
      ? parseFloat(((totalCAVentes30j / (totalCAVentes30j + totalCAExport30j)) * 100).toFixed(1))
      : 0;

    // --- Ventes par type de client ---
    const ventesParTypeClient = {};
    ventes30j.forEach(v => {
      if (!ventesParTypeClient[v.typeClient]) {
        ventesParTypeClient[v.typeClient] = { type: v.typeClient, total: 0, quantite: 0, nbVentes: 0 };
      }
      ventesParTypeClient[v.typeClient].total += v.total;
      ventesParTypeClient[v.typeClient].quantite += v.quantite;
      ventesParTypeClient[v.typeClient].nbVentes += 1;
    });

    // --- Ventes par espèce ---
    const ventesParEspece = {};
    ventes30j.forEach(v => {
      const espece = v.stock?.espece || v.espece || 'Inconnue';
      if (!ventesParEspece[espece]) {
        ventesParEspece[espece] = { espece, total: 0, quantite: 0, nbVentes: 0 };
      }
      ventesParEspece[espece].total += v.total;
      ventesParEspece[espece].quantite += v.quantite;
      ventesParEspece[espece].nbVentes += 1;
    });

    // --- CA par mois (90j) ---
    const caParMois = {};
    ventes90j.forEach(v => {
      const key = `${v.date.getFullYear()}-${String(v.date.getMonth() + 1).padStart(2, '0')}`;
      if (!caParMois[key]) caParMois[key] = { mois: key, total: 0, quantite: 0 };
      caParMois[key].total += v.total;
      caParMois[key].quantite += v.quantite;
    });

    // --- Tendances annuelles ---
    const caAnnuel = {};
    ventesAnnuel.forEach(v => {
      const key = `${v.date.getFullYear()}-${String(v.date.getMonth() + 1).padStart(2, '0')}`;
      if (!caAnnuel[key]) caAnnuel[key] = { mois: key, total: 0 };
      caAnnuel[key].total += v.total;
    });

    // --- Prévisions (moyenne mobile 3 mois) ---
    const moisData = Object.values(caAnnuel).sort((a, b) => a.mois.localeCompare(b.mois));
    const derniersMois = moisData.slice(-3);
    const moyenneMobile = derniersMois.length > 0
      ? derniersMois.reduce((s, m) => s + m.total, 0) / derniersMois.length
      : 0;

    const previsionMoisProchain = {
      mois: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`,
      totalEstime: parseFloat(moyenneMobile.toFixed(2)),
      tendance: derniersMois.length >= 2
        ? (derniersMois[derniersMois.length - 1].total > derniersMois[0].total ? 'hausse' : 'baisse')
        : 'stable'
    };

    // --- Tendances CA journalières (14 derniers jours) pour sparklines réelles ---
    const tendanceCA = {};
    const date14jAgo = new Date(now);
    date14jAgo.setDate(date14jAgo.getDate() - 14);
    // Initialiser tous les jours pour éviter les trous
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      tendanceCA[key] = { date: key, total: 0 };
    }
    ventes30j.forEach(v => {
      const key = v.date.toISOString().split('T')[0];
      if (tendanceCA[key]) {
        tendanceCA[key].total += v.total;
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
    ventes30j.forEach(v => {
      const key = v.date.toISOString().split('T')[0];
      if (tendanceQuantite[key]) {
        tendanceQuantite[key].total += v.quantite;
      }
    });

    // --- Top vendeurs (utilisateurs les plus actifs en ventes) ---
    const statsParUtilisateur = {};
    ventes30j.forEach(v => {
      if (v.user) {
        const nom = `${v.user.prenom} ${v.user.nom}`;
        if (!statsParUtilisateur[nom]) statsParUtilisateur[nom] = { nom, total: 0, nbVentes: 0 };
        statsParUtilisateur[nom].total += v.total;
        statsParUtilisateur[nom].nbVentes += 1;
      }
    });

    // --- Stocks disponibles pour vente ---
    const stocksVendables = stocksDisponibles
      .filter(s => s.quantite > 0)
      .map(s => ({ espece: s.espece, quantite: s.quantite, unite: s.unite }));

    res.json({
      // KPIs
      totalCAVentes30j,
      totalQuantiteVendue30j,
      nombreVentes30j,
      panierMoyen: parseFloat(panierMoyen.toFixed(2)),
      totalCAExport30j,
      ratioLocalExport,

      // Détails
      ventesParTypeClient: Object.values(ventesParTypeClient).sort((a, b) => b.total - a.total),
      ventesParEspece: Object.values(ventesParEspece).sort((a, b) => b.total - a.total),
      caParMois: Object.values(caParMois).sort((a, b) => a.mois.localeCompare(b.mois)),
      caAnnuel: Object.values(caAnnuel).sort((a, b) => a.mois.localeCompare(b.mois)),

      // Prévisions
      previsions: {
        moisProchain: previsionMoisProchain,
        moyenneMobile: parseFloat(moyenneMobile.toFixed(2)),
      },

      // Top clients / utilisateurs
      topVendeurs: Object.values(statsParUtilisateur).sort((a, b) => b.total - a.total).slice(0, 10),

      // Stocks disponibles
      stocksVendables,

      // Tendances (données réelles pour sparklines)
      tendanceCA: Object.values(tendanceCA).sort((a, b) => a.date.localeCompare(b.date)),
      tendanceQuantite: Object.values(tendanceQuantite).sort((a, b) => a.date.localeCompare(b.date)),

      // Dernières ventes
      dernieresVentes: ventes30j.slice(0, 10).map(v => ({
        id: v.id,
        date: v.date,
        espece: v.stock?.espece || v.espece,
        quantite: v.quantite,
        total: v.total,
        typeClient: v.typeClient,
        vendeur: v.user ? `${v.user.prenom} ${v.user.nom}` : '—'
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCommercialStats };
