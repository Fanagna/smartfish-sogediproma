/**
 * IA Predictions Controller
 * 
 * Regroupe les endpoints de prédiction : captures, zones, maintenance, ventes, exportations.
 * Utilise le cache mutualisé iaContextService pour éviter de recharger les données.
 */

const prisma = require('../config/database');
const { askGemini } = require('../services/iaService');
const ctx = require('../services/iaContextService');

// ─── IA3 + IA11 — Prédictions de captures et stocks ───
const getPredictions = async (req, res, next) => {
  try {
    const { captures, stocks } = await ctx.getLightContext();

    const promptSystem = `Tu es un expert en pêche. En analysant les données fournies (captures et stocks), fais deux prédictions:
1. IA3 - Prédiction des captures: Prédis les 3 espèces les plus susceptibles d'être capturées dans les 7 prochains jours avec un pourcentage de probabilité.
2. IA11 - Prédiction des stocks: Prédis pour chaque espèce en stock si le stock sera suffisant ou insuffisant dans les 14 prochains jours.

Structure JSON attendue:
{
  "predictionCaptures": [
    { "espece": "nom", "probabilite": 85 }
  ],
  "predictionStocks": [
    { "espece": "nom", "statut": "suffisant|insuffisant", "recommandation": "texte" }
  ]
}`;

    const result = await askGemini(promptSystem, { captures, stocks }, 'PREDICTION');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── IA7 — Zones de pêche recommandées ───
const getZones = async (req, res, next) => {
  try {
    const { captures } = await ctx.getLightContext();

    const promptSystem = `Tu es un expert en pêche. En analysant les captures passées, recommande 3 zones de pêche optimales avec:
- Nom de la zone
- Espèce cible recommandée
- Meilleur moment (heure/mois)
- Justification

Structure JSON attendue:
{
  "zones": [
    { "nom": "Zone A", "espece": "nom", "moment": "texte", "justification": "texte" }
  ]
}`;

    const result = await askGemini(promptSystem, { captures }, 'ZONE');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── IA4 — Prédictions de maintenance ───
const predictMaintenance = async (req, res, next) => {
  try {
    const { bateaux, captures, maintenances } = await ctx.getFleetContext();

    const promptSystem = `Tu es un expert en maintenance maritime. Pour chaque bateau, prédis la prochaine maintenance nécessaire:
- Type de maintenance
- Date estimée
- Priorité
- Raison

Structure JSON attendue:
{
  "predictions": [
    { "bateauId": 1, "type": "texte", "dateEstimee": "YYYY-MM-DD", "priorite": "haute|moyenne|basse", "raison": "texte" }
  ]
}`;

    const result = await askGemini(promptSystem, { bateaux, maintenance: maintenances }, 'MAINTENANCE');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── IA5 — Prédictions de ventes ───
const predictSales = async (req, res, next) => {
  try {
    const { ventes, stocks } = await ctx.getPredictionsContext();

    const promptSystem = `Tu es un expert en prévision des ventes de poissons. Analyse les ventes passées et les stocks actuels pour prédire les ventes des 30 prochains jours:
- Pour chaque espèce, prévois la quantité vendue et le chiffre d'affaires estimé
- Identifie les tendances
- Donne des recommandations pour optimiser les ventes

Structure JSON attendue:
{
  "predictionVentes": [
    { "espece": "nom", "quantiteEstimee": 100, "caEstime": 1500, "tendance": "hausse|stable|baisse", "recommandation": "texte" }
  ],
  "recommandationsGenerales": [
    "texte"
  ]
}`;

    const result = await askGemini(promptSystem, { ventes, stocks }, 'VENTES');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── IA6 — Prédictions d'exportation ───
const predictExports = async (req, res, next) => {
  try {
    const { exportations, stocks } = await ctx.getPredictionsContext();

    const promptSystem = `Tu es un expert en prévision des exportations de poissons. Analyse les exportations passées et les stocks actuels pour prédire les exportations des 30 prochains jours:
- Pour chaque espèce et pays de destination, prévois la quantité exportée
- Identifie les opportunités d'exportation
- Donne des recommandations

Structure JSON attendue:
{
  "predictionExportations": [
    { "espece": "nom", "paysDestination": "nom", "quantiteEstimee": 50, "opportunite": true, "recommandation": "texte" }
  ],
  "recommandationsGenerales": [
    "texte"
  ]
}`;

    const result = await askGemini(promptSystem, { exportations, stocks }, 'EXPORT');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── IA16 — Dashboard IA Prédictif (marché, zones, recommandations métier) ───
const getDashboardPredictif = async (req, res, next) => {
  try {
    const now = new Date();
    const date30jAgo = new Date(now); date30jAgo.setDate(date30jAgo.getDate() - 30);
    const date90jAgo = new Date(now); date90jAgo.setDate(date90jAgo.getDate() - 90);

    const [captures30j, ventes30j, stocksActuels, bateaux, zonesData] = await Promise.all([
      prisma.capture.findMany({ where: { date: { gte: date30jAgo } }, select: { id: true, date: true, espece: true, poids: true, quantite: true, zonePeche: true, bateauId: true } }),
      prisma.vente.findMany({ where: { date: { gte: date30jAgo } }, orderBy: { date: 'asc' }, select: { id: true, date: true, espece: true, quantite: true, total: true, prixUnitaire: true, typeClient: true } }),
      prisma.stock.findMany({ where: { dateSortie: null }, select: { espece: true, quantite: true, seuil: true, unite: true } }),
      prisma.bateau.findMany({ select: { id: true, nom: true, type: true, carburantRestant: true, carburantCapacity: true } }),
      // Captures par zone sur 90j pour analyse tendances
      prisma.capture.groupBy({ by: ['zonePeche'], where: { date: { gte: date90jAgo } }, _sum: { poids: true, quantite: true }, _count: { _all: true } })
    ]);

    // ─── 1. ANALYSE DES PRIX DU MARCHÉ ───
    const prixParEspece = {};
    ventes30j.forEach(v => {
      if (!prixParEspece[v.espece]) prixParEspece[v.espece] = { prix: [], quantites: [], totalCA: 0, totalKg: 0, nbVentes: 0 };
      prixParEspece[v.espece].prix.push(v.prixUnitaire);
      prixParEspece[v.espece].quantites.push(v.quantite);
      prixParEspece[v.espece].totalCA += v.total;
      prixParEspece[v.espece].totalKg += v.quantite;
      prixParEspece[v.espece].nbVentes += 1;
    });

    const analysePrix = Object.entries(prixParEspece).map(([espece, data]) => {
      const prixMoyen = data.prix.length > 0 ? data.prix.reduce((a, b) => a + b, 0) / data.prix.length : 0;
      const prixMin = Math.min(...data.prix);
      const prixMax = Math.max(...data.prix);
      const tendancePrix = data.nbVentes >= 2 ?
        (data.prix[data.prix.length - 1] > data.prix[0] ? 'hausse' :
         data.prix[data.prix.length - 1] < data.prix[0] ? 'baisse' : 'stable') : 'stable';
      return {
        espece,
        prixMoyen: Math.round(prixMoyen),
        prixMin: Math.round(prixMin),
        prixMax: Math.round(prixMax),
        tendance: tendancePrix,
        caTotal: Math.round(data.totalCA),
        quantiteVendue: Math.round(data.totalKg),
        nbVentes: data.nbVentes
      };
    }).sort((a, b) => b.caTotal - a.caTotal);

    // ─── 2. PERFORMANCE DES ZONES DE PÊCHE ───
    const zonesParJour = {};
    captures30j.forEach(c => {
      const zone = c.zonePeche || 'Non spécifiée';
      if (!zonesParJour[zone]) zonesParJour[zone] = { poids: 0, quantite: 0, nbCaptures: 0, especes: new Set() };
      zonesParJour[zone].poids += c.poids;
      zonesParJour[zone].quantite += c.quantite;
      zonesParJour[zone].nbCaptures += 1;
      zonesParJour[zone].especes.add(c.espece);
    });

    const performanceZones = Object.entries(zonesParJour).map(([zone, data]) => {
      const rendement = data.nbCaptures > 0 ? parseFloat((data.poids / data.nbCaptures).toFixed(1)) : 0;
      const score = Math.round(
        (Math.min(30, (data.poids / 2000) * 30)) +
        (Math.min(25, data.nbCaptures * 2)) +
        (Math.min(25, data.especes.size * 5)) +
        (Math.min(20, rendement * 2))
      );
      return {
        zone,
        poidsTotal: parseFloat(data.poids.toFixed(1)),
        nbCaptures: data.nbCaptures,
        nbEspeces: data.especes.size,
        rendementMoyen: rendement,
        score: Math.min(100, score)
      };
    }).sort((a, b) => b.score - a.score);

    // ─── 3. RECOMMANDATIONS MÉTIER AVEC ROI ───
    const recommandations = [];

    // Recommandation par zone
    if (performanceZones.length > 0) {
      const meilleureZone = performanceZones[0];
      recommandations.push({
        type: 'zone',
        titre: `🎯 Prioriser la zone ${meilleureZone.zone}`,
        description: `${meilleureZone.nbCaptures} opérations, ${meilleureZone.poidsTotal} kg capturés — rendement ${meilleureZone.rendementMoyen} kg/opération. Score: ${meilleureZone.score}/100`,
        impact: meilleureZone.score >= 70 ? 'élevé' : 'moyen',
        action: `Concentrer les sorties de pêche sur ${meilleureZone.zone}`
      });
    }

    // Recommandation par espèce (prix)
    if (analysePrix.length > 0) {
      const meilleurPrix = analysePrix.filter(p => p.tendance === 'hausse').sort((a, b) => b.prixMoyen - a.prixMoyen)[0];
      if (meilleurPrix && meilleurPrix.prixMoyen) {
        recommandations.push({
          type: 'prix',
          titre: `💰 ${meilleurPrix.espece} en hausse — ${meilleurPrix.prixMoyen.toLocaleString('fr-FR')} Ar/kg`,
          description: `Prix en tendance haussière sur 30j. ${meilleurPrix.nbVentes} ventes, CA de ${(meilleurPrix.caTotal / 1000).toFixed(0)}k Ar`,
          impact: 'élevé',
          action: `Maximiser les captures de ${meilleurPrix.espece} pour profiter du marché`
        });
      }
    }

    // Recommandation stocks critiques
    const stocksCritiques = stocksActuels.filter(s => s.quantite <= s.seuil);
    if (stocksCritiques.length > 0) {
      recommandations.push({
        type: 'stock',
        titre: `⚠️ ${stocksCritiques.length} stock(s) sous seuil critique`,
        description: stocksCritiques.map(s => `${s.espece}: ${s.quantite} ${s.unite || 'kg'} (seuil: ${s.seuil})`).join(', '),
        impact: stocksCritiques.length > 3 ? 'critique' : 'haut',
        action: 'Réapprovisionner les stocks critiques en priorité'
      });
    }

    // Recommandation flotte
    const bateauxCarburantBas = bateaux.filter(b => b.carburantRestant < b.carburantCapacity * 0.2);
    if (bateauxCarburantBas.length > 0) {
      recommandations.push({
        type: 'flotte',
        titre: `⛽ ${bateauxCarburantBas.length} bateau(x) nécessitent un ravitaillement`,
        description: bateauxCarburantBas.map(b => `${b.nom}: ${b.carburantRestant.toFixed(0)}L / ${b.carburantCapacity}L`).join(', '),
        impact: bateauxCarburantBas.length > 2 ? 'critique' : 'haut',
        action: 'Planifier le ravitaillement en carburant'
      });
    }

    // Recommandation espèces à fort potentiel
    const topEspeces = analysePrix.slice(0, 3);
    if (topEspeces.length >= 2) {
      const stockTop = topEspeces.map(e => {
        const stock = stocksActuels.filter(s => s.espece === e.espece).reduce((s, x) => s + x.quantite, 0);
        return { ...e, stockDisponible: stock };
      }).filter(e => e.stockDisponible > 0);
      if (stockTop.length > 0) {
        recommandations.push({
          type: 'strategie',
          titre: '🎯 Stratégie commerciale recommandée',
          description: `Prioriser la vente de ${stockTop.map(e => `${e.espece} (${e.prixMoyen.toLocaleString('fr-FR')} Ar/kg)`).join(', ')}. Stock disponible pour écoulement.`,
          impact: 'moyen',
          action: 'Lancer des campagnes de vente ciblées sur ces espèces'
        });
      }
    }

    // ─── 4. KPIs AVEC ÉVOLUTION ───
    const totalCaptures = captures30j.length;
    const totalPoids = captures30j.reduce((s, c) => s + c.poids, 0);
    const totalCA = ventes30j.reduce((s, v) => s + v.total, 0);
    const totalStock = stocksActuels.reduce((s, st) => s + st.quantite, 0);
    const caMoyenJournalier = 30 > 0 ? totalCA / 30 : 0;

    // Évolution sur 2 périodes de 15j
    const date15jAgo = new Date(now); date15jAgo.setDate(date15jAgo.getDate() - 15);
    const captures1ereMoitie = captures30j.filter(c => c.date >= date30jAgo && c.date < date15jAgo).length;
    const captures2emeMoitie = captures30j.filter(c => c.date >= date15jAgo).length;
    const evolutionCaptures = captures1ereMoitie > 0 && captures2emeMoitie >= 0
      ? parseFloat((((captures2emeMoitie - captures1ereMoitie) / captures1ereMoitie) * 100).toFixed(1))
      : 0;

    res.json({
      // KPIs principaux
      kpis: {
        totalCaptures,
        totalPoids: parseFloat(totalPoids.toFixed(1)),
        totalCA: Math.round(totalCA),
        caMoyenJournalier: Math.round(caMoyenJournalier),
        totalStock: parseFloat(totalStock.toFixed(1)),
        nbEspeces: analysePrix.length,
        nbZones: performanceZones.length,
        stocksCritiques: stocksCritiques.length
      },
      evolutionCaptures,

      // Prix du marché
      analysePrix: analysePrix.slice(0, 8),

      // Performance des zones
      performanceZones: performanceZones.slice(0, 6),

      // Recommandations métier
      recommandations,

      // Métadonnées
      periode: '30 jours',
      nbRecommandations: recommandations.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPredictions,
  getZones,
  predictMaintenance,
  predictSales,
  predictExports,
  getDashboardPredictif,
};
