const prisma = require('../config/database');

const getDashboardStats = async (req, res, next) => {
  try {
    const date30jAgo = new Date();
    date30jAgo.setDate(date30jAgo.getDate() - 30);

    // Fetch all data in parallel
    const [
      captures30j,
      ventes30j,
      exportations30j,
      totalBateaux,
      stocksActuels,
      anomaliesEnAttente
    ] = await Promise.all([
      prisma.capture.findMany({
        where: { date: { gte: date30jAgo } },
        select: { date: true, espece: true, poids: true, quantite: true }
      }),
      prisma.vente.findMany({
        where: { date: { gte: date30jAgo } },
        select: { date: true, espece: true, quantite: true, total: true }
      }),
      prisma.exportation.findMany({
        where: { date: { gte: date30jAgo } },
        select: { date: true, espece: true, quantite: true, prixTotal: true, paysDestination: true }
      }),
      prisma.bateau.count(),
      prisma.stock.findMany({
        where: { dateSortie: null },
        select: { quantite: true, espece: true, unite: true, seuil: true, alerte: true }
      }),
      prisma.anomalie.count({ where: { statut: 'EN_ATTENTE' } })
    ]);

    // Process captures data
    const capturesParJour = {};
    const repartitionEspece = {};
    let totalQuantiteCaptures30j = 0;
    let totalPoidsCaptures30j = 0;

    captures30j.forEach(capture => {
      const dateKey = capture.date.toISOString().split('T')[0];
      if (!capturesParJour[dateKey]) {
        capturesParJour[dateKey] = { date: dateKey, totalPoids: 0, totalQuantite: 0 };
      }
      capturesParJour[dateKey].totalPoids += capture.poids;
      capturesParJour[dateKey].totalQuantite += capture.quantite;

      if (!repartitionEspece[capture.espece]) {
        repartitionEspece[capture.espece] = 0;
      }
      repartitionEspece[capture.espece] += capture.quantite;
      totalQuantiteCaptures30j += capture.quantite;
      totalPoidsCaptures30j += capture.poids;
    });

    const capturesParJourArray = Object.values(capturesParJour).sort((a, b) => a.date.localeCompare(b.date));
    const repartitionEspeceArray = Object.entries(repartitionEspece).map(([espece, value]) => ({ espece, value }));

    // Process sales data
    const ventesParJour = {};
    const caVentesParEspece = {};
    let totalCAVentes30j = 0;

    ventes30j.forEach(vente => {
      const dateKey = vente.date.toISOString().split('T')[0];
      if (!ventesParJour[dateKey]) {
        ventesParJour[dateKey] = { date: dateKey, totalCA: 0 };
      }
      ventesParJour[dateKey].totalCA += vente.total;

      if (!caVentesParEspece[vente.espece]) {
        caVentesParEspece[vente.espece] = 0;
      }
      caVentesParEspece[vente.espece] += vente.total;
      totalCAVentes30j += vente.total;
    });

    const ventesParJourArray = Object.values(ventesParJour).sort((a, b) => a.date.localeCompare(b.date));
    const caVentesParEspeceArray = Object.entries(caVentesParEspece).map(([espece, value]) => ({ espece, value }));

    // Process exports data
    const exportationsParJour = {};
    const exportationsParPays = {};
    let totalCAExportations30j = 0;

    exportations30j.forEach(exportation => {
      const dateKey = exportation.date.toISOString().split('T')[0];
      if (!exportationsParJour[dateKey]) {
        exportationsParJour[dateKey] = { date: dateKey, totalCA: 0 };
      }
      exportationsParJour[dateKey].totalCA += exportation.prixTotal;

      if (!exportationsParPays[exportation.paysDestination]) {
        exportationsParPays[exportation.paysDestination] = 0;
      }
      exportationsParPays[exportation.paysDestination] += exportation.prixTotal;
      totalCAExportations30j += exportation.prixTotal;
    });

    const exportationsParJourArray = Object.values(exportationsParJour).sort((a, b) => a.date.localeCompare(b.date));
    const exportationsParPaysArray = Object.entries(exportationsParPays).map(([pays, value]) => ({ pays, value }));

    const stockTotal = stocksActuels.reduce((sum, s) => sum + s.quantite, 0);
    const totalCATotal30j = totalCAVentes30j + totalCAExportations30j;

    res.json({
      // KPI Cards
      totalCaptures30j: captures30j.length,
      totalQuantiteCaptures30j,
      totalPoidsCaptures30j,
      totalCAVentes30j,
      totalCAExportations30j,
      totalCATotal30j,
      totalBateaux,
      stockTotal,
      anomaliesEnAttente,

      // Line Charts
      capturesParJour: capturesParJourArray,
      ventesParJour: ventesParJourArray,
      exportationsParJour: exportationsParJourArray,

      // Pie/Bar Charts
      repartitionEspece: repartitionEspeceArray,
      caVentesParEspece: caVentesParEspeceArray,
      exportationsParPays: exportationsParPaysArray
    });
  } catch (error) {
    next(error);
  }
};

const getExecutiveAvanceStats = async (req, res, next) => {
  try {
    const now = new Date();
    const date30jAgo = new Date(now);
    date30jAgo.setDate(date30jAgo.getDate() - 30);
    const date90jAgo = new Date(now);
    date90jAgo.setDate(date90jAgo.getDate() - 90);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ─── Récupération parallèle de TOUTES les données ───
    const [
      bateaux,
      captures30j,
      captures90j,
      capturesToday,
      ventes30j,
      exportations30j,
      maintenances,
      stocksActuels,
      anomaliesEnAttente,
      achats30j
    ] = await Promise.all([
      // Bateaux avec détails
      prisma.bateau.findMany({
        include: {
          capitaine: { select: { id: true, nom: true, prenom: true } },
          captures: { orderBy: { date: 'desc' }, take: 50, select: { id: true, date: true, espece: true, poids: true, quantite: true, zonePeche: true } },
          maintenance: { where: { date: { gte: date30jAgo } }, select: { cout: true, type: true } },
          stocks: { where: { dateSortie: null }, select: { quantite: true, espece: true, seuil: true } }
        }
      }),
      // Captures 30j
      prisma.capture.findMany({
        where: { date: { gte: date30jAgo } },
        select: { id: true, date: true, espece: true, poids: true, quantite: true, zonePeche: true, bateauId: true, bateau: { select: { nom: true } } }
      }),
      // Captures 90j (pour tendances)
      prisma.capture.findMany({
        where: { date: { gte: date90jAgo } },
        select: { date: true, poids: true, zonePeche: true, espece: true }
      }),
      // Captures aujourd'hui
      prisma.capture.count({ where: { date: { gte: todayStart } } }),
      // Ventes 30j
      prisma.vente.findMany({
        where: { date: { gte: date30jAgo } },
        select: { id: true, date: true, espece: true, quantite: true, total: true, typeClient: true, stock: { select: { bateau: { select: { nom: true } } } } }
      }),
      // Exportations 30j
      prisma.exportation.findMany({
        where: { date: { gte: date30jAgo } },
        select: { id: true, date: true, espece: true, quantite: true, prixTotal: true, paysDestination: true, statut: true }
      }),
      // Maintenances 30j
      prisma.maintenance.findMany({
        where: { date: { gte: date30jAgo } },
        select: { id: true, date: true, type: true, cout: true, statut: true, bateauId: true, bateau: { select: { nom: true } } }
      }),
      // Stocks
      prisma.stock.findMany({
        where: { dateSortie: null },
        select: { id: true, espece: true, quantite: true, unite: true, seuil: true, alerte: true, bateau: { select: { nom: true } } }
      }),
      // Anomalies en attente (avec détails)
      prisma.anomalie.findMany({
        where: { statut: { in: ['EN_ATTENTE', 'EN_COURS'] } },
        orderBy: { date: 'desc' },
        take: 50,
        select: { id: true, description: true, type: true, urgence: true, date: true }
      }),
      // Achats 30j (coûts)
      prisma.achat.findMany({
        where: { date: { gte: date30jAgo } },
        select: { total: true, fournisseur: true, espece: true }
      })
    ]);

    // ─── KPIs GLOBAUX ───
    const totalCAVentes30j = ventes30j.reduce((s, v) => s + v.total, 0);
    const totalCAExport30j = exportations30j.reduce((s, e) => s + e.prixTotal, 0);
    const totalCATotal30j = totalCAVentes30j + totalCAExport30j;
    const totalPoids30j = captures30j.reduce((s, c) => s + c.poids, 0);
    const totalQuantite30j = captures30j.reduce((s, c) => s + c.quantite, 0);
    const totalCoutAchats30j = achats30j.reduce((s, a) => s + a.total, 0);
    const totalCoutMaintenance30j = maintenances.reduce((s, m) => s + (m.cout || 0), 0);
    const coutOperationnelTotal30j = totalCoutAchats30j + totalCoutMaintenance30j;
    const margeBrute30j = totalCATotal30j - coutOperationnelTotal30j;
    const margeBrute30jRatio = totalCATotal30j > 0 ? parseFloat(((margeBrute30j / totalCATotal30j) * 100).toFixed(1)) : 0;
    const stockTotal = stocksActuels.reduce((s, st) => s + st.quantite, 0);
    const nbAnomaliesCritiques = anomaliesEnAttente.filter(a => a.urgence === 'CRITIQUE' || a.urgence === 'HAUTE').length;
    const alertesStock = stocksActuels.filter(s => s.alerte || s.quantite <= s.seuil).length;

    // ─── RENTABILITÉ PAR BATEAU ───
    const ventesParBateau = {};
    ventes30j.forEach(v => {
      const nomBateau = v.stock?.bateau?.nom || 'Inconnu';
      if (!ventesParBateau[nomBateau]) ventesParBateau[nomBateau] = { totalCA: 0, totalKg: 0, nbVentes: 0 };
      ventesParBateau[nomBateau].totalCA += v.total;
      ventesParBateau[nomBateau].totalKg += v.quantite;
      ventesParBateau[nomBateau].nbVentes += 1;
    });

    const rentabiliteBateaux = bateaux.map(b => {
      const capturesBateau = captures30j.filter(c => c.bateauId === b.id);
      const totalPoidsBateau = capturesBateau.reduce((s, c) => s + c.poids, 0);
      const totalCapturesBateau = capturesBateau.length;
      const coutMaintenanceBateau = maintenances.filter(m => m.bateauId === b.id).reduce((s, m) => s + (m.cout || 0), 0);
      const carburantConsomme = b.carburantCapacity - b.carburantRestant;
      const caBateau = ventesParBateau[b.nom]?.totalCA || 0;

      // Ratio capture / carburant (kg par litre)
      const ratioCaptureCarburant = carburantConsomme > 0 ? parseFloat((totalPoidsBateau / carburantConsomme).toFixed(2)) : 0;

      // Marge estimée
      const margeEstimee = caBateau - coutMaintenanceBateau;

      // Score de performance (0-100)
      let performance = 0;
      if (totalPoidsBateau > 0) {
        const scoreVolume = Math.min(40, (totalPoidsBateau / 500) * 40);
        const scoreRatio = Math.min(30, ratioCaptureCarburant * 10);
        const scoreCA = Math.min(30, (caBateau / 10000) * 30);
        performance = Math.round(scoreVolume + scoreRatio + scoreCA);
      }

      return {
        id: b.id,
        nom: b.nom,
        immatriculation: b.immatriculation,
        type: b.type,
        capitaine: b.capitaine ? `${b.capitaine.prenom} ${b.capitaine.nom}` : '—',
        totalCaptures: totalCapturesBateau,
        totalPoids: parseFloat(totalPoidsBateau.toFixed(1)),
        ca: caBateau,
        coutMaintenance: coutMaintenanceBateau,
        margeEstimee: parseFloat(margeEstimee.toFixed(2)),
        ratioCaptureCarburant,
        carburantRestant: b.carburantRestant,
        carburantCapacity: b.carburantCapacity,
        performance
      };
    }).sort((a, b) => b.performance - a.performance);

    // ─── PERFORMANCE PAR ZONE ───
    const zonesMap = {};
    captures30j.forEach(c => {
      const zone = c.zonePeche || 'Non spécifiée';
      if (!zonesMap[zone]) zonesMap[zone] = { poids: 0, quantite: 0, nbCaptures: 0, especes: new Set(), ca: 0, caExport: 0 };
      zonesMap[zone].poids += c.poids;
      zonesMap[zone].quantite += c.quantite;
      zonesMap[zone].nbCaptures += 1;
      zonesMap[zone].especes.add(c.espece);
    });

    ventes30j.forEach(v => {
      // On répartit le CA par zone via les captures de la même espèce
      const zonePrincipale = captures30j.filter(c => c.espece === v.espece).reduce((acc, c) => {
        const z = c.zonePeche || 'Non spécifiée';
        acc[z] = (acc[z] || 0) + c.poids;
        return acc;
      }, {});
      const topZone = Object.entries(zonePrincipale).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topZone && zonesMap[topZone]) {
        zonesMap[topZone].ca += v.total;
      }
    });

    const performanceZones = Object.entries(zonesMap).map(([zone, data]) => {
      const poidsMoyen = data.nbCaptures > 0 ? parseFloat((data.poids / data.nbCaptures).toFixed(1)) : 0;
      const scorePerformance = Math.min(100, Math.round(
        (Math.min(30, (data.poids / 2000) * 30)) +
        (Math.min(30, (data.nbCaptures / 50) * 30)) +
        (Math.min(20, data.especes.size * 5)) +
        (Math.min(20, (data.ca / 5000) * 20))
      ));
      return {
        zone,
        totalPoids: parseFloat(data.poids.toFixed(1)),
        totalQuantite: data.quantite,
        nbCaptures: data.nbCaptures,
        nbEspeces: data.especes.size,
        poidsMoyen,
        ca: parseFloat(data.ca.toFixed(2)),
        performance: scorePerformance
      };
    }).sort((a, b) => b.performance - a.performance);

    // ─── TENDANCES ───
    const capturesParJour = {};
    captures30j.forEach(c => {
      const key = c.date.toISOString().split('T')[0];
      if (!capturesParJour[key]) capturesParJour[key] = { date: key, poids: 0, quantite: 0, nbCaptures: 0 };
      capturesParJour[key].poids += c.poids;
      capturesParJour[key].quantite += c.quantite;
      capturesParJour[key].nbCaptures += 1;
    });

    const caParJour = {};
    ventes30j.forEach(v => {
      const key = v.date.toISOString().split('T')[0];
      if (!caParJour[key]) caParJour[key] = { date: key, ca: 0 };
      caParJour[key].ca += v.total;
    });
    exportations30j.forEach(e => {
      const key = e.date.toISOString().split('T')[0];
      if (!caParJour[key]) caParJour[key] = { date: key, ca: 0 };
      caParJour[key].ca += e.prixTotal;
    });

    // ─── TOP ESPÈCES (par CA) ───
    const caParEspece = {};
    ventes30j.forEach(v => {
      if (!caParEspece[v.espece]) caParEspece[v.espece] = { espece: v.espece, ca: 0, quantite: 0 };
      caParEspece[v.espece].ca += v.total;
      caParEspece[v.espece].quantite += v.quantite;
    });

    // ─── ÉVOLUTION MENSUELLE (90j) ───
    const evolutionMensuelle = {};
    captures90j.forEach(c => {
      const key = `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, '0')}`;
      if (!evolutionMensuelle[key]) evolutionMensuelle[key] = { mois: key, poids: 0, ca: 0 };
      evolutionMensuelle[key].poids += c.poids;
    });
    // Ajouter CA aux mois
    const allVentes90j = await prisma.vente.findMany({
      where: { date: { gte: date90jAgo } },
      select: { date: true, total: true }
    });
    allVentes90j.forEach(v => {
      const key = `${v.date.getFullYear()}-${String(v.date.getMonth() + 1).padStart(2, '0')}`;
      if (!evolutionMensuelle[key]) evolutionMensuelle[key] = { mois: key, poids: 0, ca: 0 };
      evolutionMensuelle[key].ca += v.total;
    });

    // ─── ALERTES CRITIQUES CONSOLIDÉES ───
    const alertesCritiques = [];

    // Anomalies critiques
    anomaliesEnAttente.filter(a => a.urgence === 'CRITIQUE' || a.urgence === 'HAUTE').forEach(a => {
      alertesCritiques.push({
        type: 'ANOMALIE',
        urgence: a.urgence,
        description: a.description,
        date: a.date,
        entite: a.type
      });
    });

    // Stocks sous seuil
    stocksActuels.filter(s => s.alerte || s.quantite <= s.seuil).forEach(s => {
      alertesCritiques.push({
        type: 'STOCK',
        urgence: s.quantite <= s.seuil * 0.5 ? 'CRITIQUE' : 'HAUTE',
        description: `Stock bas: ${s.espece} (${s.quantite} ${s.unite || 'kg'} / seuil: ${s.seuil})`,
        date: now.toISOString(),
        entite: `${s.espece} — ${s.bateau?.nom || ''}`
      });
    });

    // Bateaux avec carburant critique
    bateaux.filter(b => b.carburantRestant < b.carburantCapacity * 0.15).forEach(b => {
      alertesCritiques.push({
        type: 'CARBURANT',
        urgence: b.carburantRestant <= 0 ? 'CRITIQUE' : 'HAUTE',
        description: `Carburant bas: ${b.nom} (${b.carburantRestant.toFixed(0)}L / ${b.carburantCapacity}L)`,
        date: now.toISOString(),
        entite: b.nom
      });
    });

    // Bateaux sans capture depuis 14+ jours
    bateaux.filter(b => {
      const dernieresCaps = b.captures;
      if (dernieresCaps.length === 0) return true;
      const derniereDate = new Date(dernieresCaps[0].date);
      return (now - derniereDate) > 14 * 24 * 60 * 60 * 1000;
    }).forEach(b => {
      const derniereDate = b.captures[0]?.date ? new Date(b.captures[0].date).toLocaleDateString('fr-FR') : 'aucune';
      alertesCritiques.push({
        type: 'INACTIVITE',
        urgence: 'MOYENNE',
        description: `Bateau inactif: ${b.nom} (dernière capture: ${derniereDate})`,
        date: now.toISOString(),
        entite: b.nom
      });
    });

    alertesCritiques.sort((a, b) => {
      const order = { CRITIQUE: 0, HAUTE: 1, MOYENNE: 2, BASSE: 3 };
      return (order[a.urgence] || 99) - (order[b.urgence] || 99);
    });

    // ─── CASHFLOW (30j) ───
    const cashflow = {
      entrees: totalCATotal30j,
      sorties: coutOperationnelTotal30j,
      solde: margeBrute30j,
      ratio: margeBrute30jRatio
    };

    // ─── STATUT FLOTTE ───
    const flotteStats = {
      total: bateaux.length,
      actifs: bateaux.filter(b => b.carburantRestant > b.carburantCapacity * 0.15).length,
      enAlerte: bateaux.filter(b => b.carburantRestant > 0 && b.carburantRestant <= b.carburantCapacity * 0.15).length,
      critique: bateaux.filter(b => b.carburantRestant <= 0).length,
      inactifs: bateaux.filter(b => b.captures.length === 0 || (now - new Date(b.captures[0]?.date)) > 14 * 24 * 60 * 60 * 1000).length
    };

    res.json({
      // KPIS GLOBAUX
      kpis: {
        caTotal30j: totalCATotal30j,
        caVentes30j: totalCAVentes30j,
        caExport30j: totalCAExport30j,
        totalCaptures30j: captures30j.length,
        totalPoids30j: parseFloat(totalPoids30j.toFixed(1)),
        totalQuantite30j,
        capturesToday,
        stockTotal: parseFloat(stockTotal.toFixed(1)),
        alertesStock,
        anomaliesActives: anomaliesEnAttente.length,
        anomaliesCritiques: nbAnomaliesCritiques,
        coutOperationnel30j: parseFloat(coutOperationnelTotal30j.toFixed(2)),
        margeBrute30j: parseFloat(margeBrute30j.toFixed(2)),
        margeBruteRatio: margeBrute30jRatio,
        nbBateaux: bateaux.length,
        nbBateauxActifs: flotteStats.actifs
      },

      rentabiliteBateaux,
      performanceZones,
      flotteStats,
      cashflow,

      tendances: {
        capturesParJour: Object.values(capturesParJour).sort((a, b) => a.date.localeCompare(b.date)),
        caParJour: Object.values(caParJour).sort((a, b) => a.date.localeCompare(b.date)),
        evolutionMensuelle: Object.values(evolutionMensuelle).sort((a, b) => a.mois.localeCompare(b.mois))
      },

      topEspeces: Object.values(caParEspece).sort((a, b) => b.ca - a.ca).slice(0, 10),

      alertesCritiques: alertesCritiques.slice(0, 20)
    });
  } catch (error) {
    next(error);
  }
};

// ─── Activités Récentes Combinées ───
const getRecentActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [captures, ventes, exportations, anomalies, maintenances] = await Promise.all([
      prisma.capture.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        select: {
          id: true, date: true, espece: true, poids: true, quantite: true, zonePeche: true,
          bateau: { select: { nom: true } },
          user: { select: { prenom: true, nom: true } }
        }
      }),
      prisma.vente.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        select: {
          id: true, date: true, espece: true, quantite: true, total: true, typeClient: true,
          user: { select: { prenom: true, nom: true } }
        }
      }),
      prisma.exportation.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        select: {
          id: true, date: true, espece: true, quantite: true, paysDestination: true, prixTotal: true,
          user: { select: { prenom: true, nom: true } }
        }
      }),
      prisma.anomalie.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        select: {
          id: true, date: true, description: true, type: true, urgence: true, statut: true
        }
      }),
      prisma.maintenance.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        select: {
          id: true, date: true, type: true, description: true, statut: true,
          bateau: { select: { nom: true } }
        }
      })
    ]);

    const activities = [
      ...captures.map(c => ({
        id: `capture-${c.id}`,
        type: 'capture',
        title: `Capture : ${c.espece}`,
        description: `${c.poids.toFixed(1)} kg pêchés en ${c.zonePeche || 'zone inconnue'}${c.bateau?.nom ? ` par ${c.bateau.nom}` : ''}`,
        date: c.date.toISOString(),
        user: c.user ? `${c.user.prenom} ${c.user.nom}` : null
      })),
      ...ventes.map(v => ({
        id: `vente-${v.id}`,
        type: 'vente',
        title: `Vente : ${v.quantite} kg de ${v.espece}`,
        description: `Vente ${v.typeClient === 'EXPORTATEUR' ? 'export' : 'locale'} — ${v.user ? `par ${v.user.prenom} ${v.user.nom}` : ''}`,
        date: v.date.toISOString()
      })),
      ...exportations.map(e => ({
        id: `export-${e.id}`,
        type: 'export',
        title: `Exportation : ${e.espece} vers ${e.paysDestination}`,
        description: `${e.quantite} kg — ${e.user ? `par ${e.user.prenom} ${e.user.nom}` : ''}`,
        date: e.date.toISOString()
      })),
      ...anomalies.map(a => ({
        id: `anomalie-${a.id}`,
        type: 'anomalie',
        title: `Anomalie: ${a.description?.substring(0, 50)}${a.description?.length > 50 ? '...' : ''}`,
        description: `${a.type} — ${a.urgence === 'CRITIQUE' || a.urgence === 'HAUTE' ? '⚠️ Urgence ' + a.urgence : a.urgence}`,
        date: a.date.toISOString()
      })),
      ...maintenances.map(m => ({
        id: `maintenance-${m.id}`,
        type: 'bateau',
        title: `Maintenance : ${m.type}`,
        description: `${m.description}${m.bateau?.nom ? ` — ${m.bateau.nom}` : ''} — ${m.statut}`,
        date: m.date.toISOString()
      }))
    ];

    // Trier par date (plus récent en premier) et limiter
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      activities: activities.slice(0, limit),
      total: activities.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getExecutiveAvanceStats, getRecentActivities };
