const prisma = require('../config/database');

/**
 * Obtient la consommation horaire (L/h) d'un bateau.
 * Utilise d'abord la valeur réelle saisie (consoHoraire), 
 * sinon estimée par type de bateau.
 */
function getConsoHoraire(bateau) {
  if (bateau.consoHoraire != null && bateau.consoHoraire > 0) {
    return bateau.consoHoraire; // Donnée réelle saisie par le capitaine
  }
  // Estimation par type si pas de donnée réelle
  const consoMap = {
    'Pêche côtière': 15, 'Pêche hauturière': 60, 'Thonier': 120, 'Chalutier': 90,
    'Palangrier': 40, 'Fileyeur': 25, 'Caseyeur': 20, 'Drageur': 70, 'Senneur': 100, 'Polyvalent': 50
  };
  return consoMap[bateau.type] || 35;
}

/**
 * Calcule l'autonomie restante en heures de mer
 */
function calculerAutonomie(carburantRestant, consoHoraire, reserveSecurite = 0.15) {
  if (consoHoraire <= 0) return { heures: 0, minutes: 0, totalHeures: 0, avecReserve: 0 };
  const utilisable = carburantRestant * (1 - reserveSecurite); // 15% de réserve de sécurité
  const totalHeures = carburantRestant / consoHoraire;
  const heuresAvecReserve = utilisable / consoHoraire;
  return {
    heures: Math.floor(totalHeures),
    minutes: Math.round((totalHeures % 1) * 60),
    totalHeures: parseFloat(totalHeures.toFixed(1)),
    avecReserve: parseFloat(heuresAvecReserve.toFixed(1)),
    autonomieKm: parseFloat((totalHeures * 20).toFixed(0)), // ~20 km/h vitesse moyenne
  };
}

/**
 * Calcule le coût estimé d'une sortie en mer
 */
function calculerCoutSortie(heures, consoHoraire, prixCarburant = 4800) {
  // Prix du gasoil à Madagascar ~4800 Ar/L
  const litresConsommes = heures * consoHoraire;
  const coutCarburant = litresConsommes * prixCarburant;
  const coutMaintenance = coutCarburant * 0.15; // ~15% du carburant pour maintenance
  const coutEquipage = heures * 2000; // ~2000 Ar/heure par sortie
  return {
    litresConsommes: parseFloat(litresConsommes.toFixed(1)),
    coutCarburant: Math.round(coutCarburant),
    coutMaintenance: Math.round(coutMaintenance),
    coutEquipage: Math.round(coutEquipage),
    coutTotal: Math.round(coutCarburant + coutMaintenance + coutEquipage)
  };
}

const getOperationnelStats = async (req, res, next) => {
  try {
    const now = new Date();
    const date30jAgo = new Date(now);
    date30jAgo.setDate(date30jAgo.getDate() - 30);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const date7jAgo = new Date(now);
    date7jAgo.setDate(date7jAgo.getDate() - 7);

    const PRIX_CARBURANT = 4800; // Ar/L — prix gasoil Madagascar

    const [bateaux, captures30j, capturesToday, anomaliesActives, maintenances, stocksAlertes, ventes7j] = await Promise.all([
      // Bateaux avec infos complètes
      prisma.bateau.findMany({
        include: {
          capitaine: { select: { id: true, nom: true, prenom: true } },
          captures: { take: 1, orderBy: { date: 'desc' }, select: { date: true, espece: true, poids: true } },
          maintenance: { take: 3, orderBy: { date: 'desc' }, select: { date: true, type: true, statut: true, cout: true } }
        }
      }),
      // Captures 30 derniers jours
      prisma.capture.findMany({
        where: { date: { gte: date30jAgo } },
        orderBy: { date: 'desc' },
        include: { bateau: { select: { nom: true, immatriculation: true } }, user: { select: { nom: true, prenom: true } } }
      }),
      // Captures du jour
      prisma.capture.count({ where: { date: { gte: todayStart } } }),
      // Anomalies actives
      prisma.anomalie.findMany({
        where: { statut: { in: ['EN_ATTENTE', 'EN_COURS'] } },
        orderBy: { date: 'desc' },
        take: 20,
        include: { user: { select: { nom: true, prenom: true } } }
      }),
      // Maintenances en cours
      prisma.maintenance.findMany({
        where: { statut: { in: ['EN_COURS', 'PLANIFIEE'] } },
        orderBy: { date: 'desc' },
        include: { bateau: { select: { nom: true } } }
      }),
      // Stocks en alerte (sous le seuil)
      prisma.stock.findMany({
        where: { dateSortie: null },
        include: { bateau: { select: { nom: true } } }
      }),
      // Ventes 7 derniers jours (pour estimation CA journalier)
      prisma.vente.findMany({
        where: { date: { gte: date7jAgo } },
        select: { total: true, espece: true }
      })
    ]);

    // Filter stock below threshold in JS (Prisma can't compare columns)
    const stocksSousSeuil = stocksAlertes.filter(s => s.quantite <= s.seuil);

    // Statistiques flotte enrichies
    const totalCarburantRestant = bateaux.reduce((s, b) => s + b.carburantRestant, 0);
    const totalCapacite = bateaux.reduce((s, b) => s + b.carburantCapacity, 0);
    const flotteStats = {
      total: bateaux.length,
      actifs: bateaux.filter(b => b.carburantRestant > 0).length,
      enMer: bateaux.filter(b => b.carburantRestant < b.carburantCapacity * 0.3 && b.carburantRestant > 0).length,
      aQuai: bateaux.filter(b => b.carburantRestant >= b.carburantCapacity * 0.3).length,
      aSec: bateaux.filter(b => b.carburantRestant <= 0).length,
      carburantMoyen: bateaux.length > 0
        ? parseFloat((bateaux.reduce((s, b) => s + (b.carburantRestant / b.carburantCapacity) * 100, 0) / bateaux.length).toFixed(1))
        : 0,
      totalCarburantRestant: parseFloat(totalCarburantRestant.toFixed(0)),
      totalCapacite: parseFloat(totalCapacite.toFixed(0)),
      autonomieMoyenneFlotte: bateaux.length > 0
        ? parseFloat((bateaux.reduce((s, b) => s + (b.carburantRestant / Math.max(getConsoHoraire(b), 1)), 0) / bateaux.length).toFixed(1))
        : 0
    };

    // Dernières captures (feed temps réel)
    const capturesRealtime = captures30j.slice(0, 10).map(c => ({
      id: c.id,
      date: c.date,
      espece: c.espece,
      poids: c.poids,
      quantite: c.quantite,
      zonePeche: c.zonePeche,
      bateau: c.bateau?.nom,
      utilisateur: c.user ? `${c.user.prenom} ${c.user.nom}` : '—'
    }));

    // Captures par jour (30j)
    const capturesParJour = {};
    captures30j.forEach(c => {
      const key = c.date.toISOString().split('T')[0];
      if (!capturesParJour[key]) capturesParJour[key] = { date: key, totalPoids: 0, totalQuantite: 0, nbOperations: 0 };
      capturesParJour[key].totalPoids += c.poids;
      capturesParJour[key].totalQuantite += c.quantite;
      capturesParJour[key].nbOperations += 1;
    });

    // État des bateaux enrichi avec autonomie et coûts
    const etatBateaux = bateaux.map(b => {
      const fuelRatio = b.carburantCapacity > 0 ? (b.carburantRestant / b.carburantCapacity) * 100 : 0;
      const derniereCapture = b.captures?.[0];
      const joursDepuisCapture = derniereCapture
        ? Math.floor((now - new Date(derniereCapture.date)) / (1000 * 60 * 60 * 24))
        : null;
      const consoHoraire = getConsoHoraire(b);
      const autonomie = calculerAutonomie(b.carburantRestant, consoHoraire);

      // Captures du bateau sur 30j
      const capturesBateau = captures30j.filter(c => c.bateauId === b.id);
      const totalPoidsBateau = capturesBateau.reduce((s, c) => s + c.poids, 0);
      const totalCapturesBateau = capturesBateau.length;

      // Coûts estimés sur 30j
      const heuresEstimeesMer30j = totalCapturesBateau * 8; // ~8h par sortie de pêche
      const coutsEstimes = calculerCoutSortie(heuresEstimeesMer30j, consoHoraire, PRIX_CARBURANT);

      // Efficacité (kg de poisson par litre de carburant)
      const litresConsoEstimes = heuresEstimeesMer30j * consoHoraire;
      const efficaciteCarburant = litresConsoEstimes > 0
        ? parseFloat((totalPoidsBateau / litresConsoEstimes).toFixed(2))
        : 0;

      // Statut enrichi
      let statut = 'ACTIF';
      if (fuelRatio <= 0) statut = 'CRITIQUE';
      else if (fuelRatio <= 10) statut = 'CRITIQUE';
      else if (fuelRatio <= 25) statut = 'ALERTE';
      else if (joursDepuisCapture !== null && joursDepuisCapture > 14) statut = 'INACTIF';

      return {
        id: b.id,
        nom: b.nom,
        immatriculation: b.immatriculation,
        type: b.type,
        longueur: b.longueur,
        // Carburant
        carburant: parseFloat(fuelRatio.toFixed(1)),
        carburantRestant: b.carburantRestant,
        carburantCapacity: b.carburantCapacity,
        consoHoraire,
        autonomie,
        // Équipage
        capitaine: b.capitaine ? `${b.capitaine.prenom} ${b.capitaine.nom}` : '—',
        // Performance
        derniereCapture: derniereCapture ? {
          date: derniereCapture.date,
          espece: derniereCapture.espece,
          poids: derniereCapture.poids
        } : null,
        joursDepuisCapture,
        totalPoids30j: parseFloat(totalPoidsBateau.toFixed(1)),
        totalCaptures30j: totalCapturesBateau,
        coutsEstimes,
        efficaciteCarburant,
        // Maintenance
        statut
      };
    });

    // Alertes actives enrichies
    const alertesEnrichies = anomaliesActives.map(a => ({
      ...a,
      priorite: a.urgence === 'CRITIQUE' ? 1 : a.urgence === 'HAUTE' ? 2 : a.urgence === 'MOYENNE' ? 3 : 4
    })).sort((a, b) => a.priorite - b.priorite);

    // Bateaux avec carburant critique (alerte dérive)
    const alertesDerive = etatBateaux
      .filter(b => b.carburant <= 25 && b.statut !== 'INACTIF')
      .map(b => ({
        id: b.id,
        description: `⚠️ ${b.nom} — Carburant à ${b.carburant}% (${b.carburantRestant.toFixed(0)}L), autonomie ${b.autonomie.totalHeures}h`,
        urgence: b.carburant <= 10 ? 'CRITIQUE' : 'HAUTE',
        type: 'CARBURANT',
        date: now.toISOString()
      }));

    // Bateaux inactifs (dérive opérationnelle)
    const alertesInactivite = etatBateaux
      .filter(b => b.joursDepuisCapture !== null && b.joursDepuisCapture > 10)
      .map(b => ({
        id: b.id,
        description: `⚠️ ${b.nom} — Inactif depuis ${b.joursDepuisCapture} jours (dernière capture: ${b.derniereCapture?.espece || 'inconnue'})`,
        urgence: b.joursDepuisCapture > 21 ? 'HAUTE' : 'MOYENNE',
        type: 'INACTIVITE',
        date: b.derniereCapture?.date?.toISOString() || now.toISOString()
      }));

    // CA journalier estimé (7 derniers jours)
    const caTotal7j = ventes7j.reduce((s, v) => s + v.total, 0);
    const caJournalierEstime = Math.round(caTotal7j / 7);

    res.json({
      // KPIs enrichis
      flotteStats,
      capturesToday,
      totalCaptures30j: captures30j.length,
      totalPoids30j: parseFloat(captures30j.reduce((s, c) => s + c.poids, 0).toFixed(1)),
      anomaliesActivesCount: anomaliesActives.length,
      nbMaintenancesEnCours: maintenances.length,
      stocksAlertesCount: stocksSousSeuil.length,
      caJournalierEstime,

      // Données détaillées enrichies
      capturesRealtime,
      capturesParJour: Object.values(capturesParJour).sort((a, b) => a.date.localeCompare(b.date)),
      etatBateaux,
      anomaliesActives: alertesEnrichies,
      alertesDerive,
      alertesInactivite,
      maintenances,
      stocksAlertes: stocksSousSeuil
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOperationnelStats };
