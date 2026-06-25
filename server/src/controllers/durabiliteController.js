const prisma = require('../config/database');
const { askGemini } = require('../services/iaService');

const getDurabiliteStats = async (req, res, next) => {
  try {
    const now = new Date();
    const date90jAgo = new Date(now);
    date90jAgo.setDate(date90jAgo.getDate() - 90);
    const date180jAgo = new Date(now);
    date180jAgo.setDate(date180jAgo.getDate() - 180);

    const [captures180j, capturesTotal, anomalies, stocks, zonesData, decisionLogs] = await Promise.all([
      // Captures 180 derniers jours pour analyse des tendances
      prisma.capture.findMany({
        where: { date: { gte: date180jAgo } },
        select: { date: true, espece: true, poids: true, quantite: true, zonePeche: true, profondeur: true }
      }),
      // Toutes les captures historiques (par espèce)
      prisma.capture.groupBy({
        by: ['espece'],
        _sum: { poids: true, quantite: true },
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      // Anomalies (IA9 enregistre dans cette table)
      prisma.anomalie.findMany({
        where: { date: { gte: date90jAgo } },
        orderBy: { date: 'desc' },
        take: 50
      }),
      // Stocks actuels
      prisma.stock.findMany({
        where: { dateSortie: null },
        select: { espece: true, quantite: true, seuil: true }
      }),
      // Captures groupées par zone
      prisma.capture.groupBy({
        by: ['zonePeche'],
        _sum: { poids: true, quantite: true },
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      // Dernières décisions IA (logs IA12 Risk + IA9)
      prisma.decisionLog.findMany({
        where: { type: { in: ['RISK_ANALYSIS', 'OPERATIONAL_ANOMALIES'] } },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    // ── Analyse IA12: Risques durabilité via Gemini (fallback si disponible) ──
    let iaRisques = null;
    try {
      const statsResume = {
        totalEspeces: capturesTotal.length,
        totalCaptures: captures180j.length,
        totalPoids180j: captures180j.reduce((s, c) => s + c.poids, 0),
        nbAnomalies: anomalies.filter(a => a.statut === 'EN_ATTENTE').length
      };

      const promptSystem = `Tu es un analyseur de risques environnementaux (IA12) pour la durabilité d'une flotte de pêche.
Analyse les données fournies et retourne UNIQUEMENT un JSON avec:
{
  "risquesDurabilite": [
    { "domaine": "biodiversite|ressources|reglementation", "description": "texte", "niveau": "faible|moyen|eleve", "recommandation": "texte" }
  ]
}`;

      iaRisques = await askGemini(promptSystem, { captures: captures180j, stocks, anomalies }, 'RISK_ANALYSIS');
    } catch (e) {
      // IA non disponible — on continue sans
      iaRisques = null;
    }

    // ── Analyse des espèces exploitées ──
    const capturesParEspeceEtMois = {};

    captures180j.forEach(c => {
      const mois = `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, '0')}`;
      if (!capturesParEspeceEtMois[c.espece]) capturesParEspeceEtMois[c.espece] = {};
      if (!capturesParEspeceEtMois[c.espece][mois]) capturesParEspeceEtMois[c.espece][mois] = { poids: 0, quantite: 0, count: 0 };
      capturesParEspeceEtMois[c.espece][mois].poids += c.poids;
      capturesParEspeceEtMois[c.espece][mois].quantite += c.quantite;
      capturesParEspeceEtMois[c.espece][mois].count += 1;
    });

    const especesList = capturesTotal.map(espece => {
      const totalPoids = espece._sum.poids || 0;
      const totalQuantite = espece._sum.quantite || 0;
      const totalCaptures = espece._count._all;
      const moisData = capturesParEspeceEtMois[espece.espece] || {};
      const moisKeys = Object.keys(moisData).sort();

      const derniers3Mois = moisKeys.slice(-3);
      const precedent3Mois = moisKeys.slice(-6, -3);
      const poidsDerniers = derniers3Mois.reduce((s, m) => s + (moisData[m]?.poids || 0), 0);
      const poidsPrecedent = precedent3Mois.reduce((s, m) => s + (moisData[m]?.poids || 0), 0);

      let tendance = 'stable';
      let scorePression = 0;
      if (poidsPrecedent > 0) {
        const ratio = poidsDerniers / poidsPrecedent;
        if (ratio > 1.3) { tendance = 'hausse'; scorePression = 3; }
        else if (ratio > 1.1) { tendance = 'legere_hausse'; scorePression = 2; }
        else if (ratio < 0.7) { tendance = 'baisse'; scorePression = 1; }
        else if (ratio < 0.9) { tendance = 'legere_baisse'; scorePression = 1; }
        else scorePression = 2;
      }

      const scoreVulnerabilite = Math.min(5, Math.max(1, Math.round(
        (scorePression * 0.4) +
        (totalQuantite > 100 ? 3 : totalQuantite > 50 ? 2 : 1) * 0.3 +
        (moisKeys.length > 4 ? 3 : moisKeys.length > 2 ? 2 : 1) * 0.3
      )));

      return {
        espece: espece.espece,
        totalPoids,
        totalQuantite,
        totalCaptures,
        poidsMoyenCapture: parseFloat((totalCaptures > 0 ? totalPoids / totalCaptures : 0).toFixed(2)),
        nbMoisActifs: moisKeys.length,
        tendance,
        scoreVulnerabilite,
        alerteSurpeche: scoreVulnerabilite >= 4
      };
    }).sort((a, b) => b.scoreVulnerabilite - a.scoreVulnerabilite);

    // ── Analyse des zones sensibles ──
    const zones = zonesData.map(zone => {
      const totalPoids = zone._sum.poids || 0;
      const totalQuantite = zone._sum.quantite || 0;
      const totalCaptures = zone._count._all;
      const capturesZone = captures180j.filter(c => c.zonePeche === zone.zonePeche);
      const moisPresence = new Set(capturesZone.map(c => `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, '0')}`));
      const profondeurs = capturesZone.map(c => c.profondeur).filter(Boolean);
      const profondeurMoyenne = profondeurs.length > 0 ? profondeurs.reduce((s, p) => s + p, 0) / profondeurs.length : null;
      const especesUniques = new Set(capturesZone.map(c => c.espece));
      const intensite = totalQuantite / Math.max(1, moisPresence.size);

      const scoreSensibilite = Math.min(5, Math.max(1, Math.round(
        (intensite > 100 ? 3 : intensite > 50 ? 2 : 1) +
        (moisPresence.size > 4 ? 2 : moisPresence.size > 2 ? 1 : 0)
      )));

      return {
        zone: zone.zonePeche,
        totalPoids,
        totalQuantite,
        totalCaptures,
        especesDifferentes: especesUniques.size,
        moisActifs: moisPresence.size,
        intensitePeche: parseFloat(intensite.toFixed(1)),
        profondeurMoyenne: profondeurMoyenne ? parseFloat(profondeurMoyenne.toFixed(1)) : null,
        scoreSensibilite,
        zoneSensible: scoreSensibilite >= 4
      };
    }).sort((a, b) => b.scoreSensibilite - a.scoreSensibilite);

    // ── Alertes surpêche ──
    const alertesSurpeche = especesList
      .filter(e => e.alerteSurpeche)
      .map(e => ({
        espece: e.espece,
        scoreVulnerabilite: e.scoreVulnerabilite,
        totalQuantite: e.totalQuantite,
        tendance: e.tendance,
        recommandation: e.tendance === 'hausse'
          ? 'Réduire les quotas de pêche — Risque d\'épuisement'
          : 'Surveiller les stocks — Maintenir les restrictions'
      }));

    // ── Anomalies environnementales (IA9) ──
    const anomaliesEnv = anomalies.filter(a =>
      a.type === 'CAPTURE' || a.type === 'STOCK' ||
      a.description?.toLowerCase().includes('capture') ||
      a.description?.toLowerCase().includes('stock') ||
      a.description?.toLowerCase().includes('surpêche') ||
      a.description?.toLowerCase().includes('environnement')
    );

    // ── Extraire les risques IA12 des logs ──
    const risquesIA12 = [];
    for (const log of decisionLogs) {
      if (log.type === 'RISK_ANALYSIS') {
        try {
          const parsed = typeof log.contenu === 'string' ? JSON.parse(log.contenu) : log.contenu;
          if (parsed.risquesFinanciers) risquesIA12.push(...parsed.risquesFinanciers.map(r => ({ ...r, domaine: 'financier' })));
          if (parsed.risquesOperationnels) risquesIA12.push(...parsed.risquesOperationnels.map(r => ({ ...r, domaine: 'operationnel' })));
          if (parsed.risquesLogistiques) risquesIA12.push(...parsed.risquesLogistiques.map(r => ({ ...r, domaine: 'logistique' })));
        } catch (e) { /* skip */ }
      }
    }

    // ── Radar: Performance environnementale ──
    const radarPerformance = [
      { axe: 'Gestion espèces', value: Math.round(Math.max(0, 100 - (especesList.filter(e => e.alerteSurpeche).length / Math.max(1, especesList.length)) * 100)), fullMark: 100 },
      { axe: 'Zones protégées', value: Math.round(Math.max(0, 100 - (zones.filter(z => z.zoneSensible).length / Math.max(1, zones.length)) * 100)), fullMark: 100 },
      { axe: 'Traçabilité', value: capturesTotal.length > 0 ? 85 : 0, fullMark: 100 },
      { axe: 'Réduction gaspillage', value: stocks.length > 0 ? Math.round(Math.max(0, 100 - (stocks.filter(s => s.quantite <= s.seuil).length / stocks.length) * 100)) : 50, fullMark: 100 },
      { axe: 'Conformité', value: anomalies.length > 0 ? Math.round(Math.max(0, 100 - (anomaliesEnv.length / Math.max(1, anomalies.length)) * 50)) : 80, fullMark: 100 },
      { axe: 'Diversité pêche', value: especesList.length > 5 ? 90 : especesList.length > 3 ? 70 : 50, fullMark: 100 }
    ];

    // ── Heatmap: Pression par zone × mois (pré-remplissage robuste) ──
    const zonesHeatmap = {};
    captures180j.forEach(c => {
      const mois = `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, '0')}`;
      if (!zonesHeatmap[c.zonePeche]) zonesHeatmap[c.zonePeche] = {};
      if (!zonesHeatmap[c.zonePeche][mois]) zonesHeatmap[c.zonePeche][mois] = 0;
      zonesHeatmap[c.zonePeche][mois] += c.poids;
    });

    const allMois = [...new Set(captures180j.map(c =>
      `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, '0')}`
    ))].sort();

    const topZones = zones.slice(0, 8).map(z => z.zone);

    // Pré-remplir toutes les combinaisons zone×mois avec 0 puis injecter les valeurs réelles
    const heatmapData = [];
    topZones.forEach(zone => {
      allMois.forEach(mois => {
        const poids = zonesHeatmap[zone]?.[mois] || 0;
        if (poids > 0) {
          heatmapData.push({ zone, mois, poids: parseFloat(poids.toFixed(1)) });
        }
      });
    });

    // ── Score global ──
    const scoreGlobal = parseFloat(
      (radarPerformance.reduce((s, r) => s + r.value, 0) / radarPerformance.length).toFixed(1)
    );

    res.json({
      totalEspeces: especesList.length,
      especesEnDanger: especesList.filter(e => e.alerteSurpeche).length,
      zonesSensibles: zones.filter(z => z.zoneSensible).length,
      totalAnomalies: anomaliesEnv.length,
      scoreGlobal,
      especes: especesList,
      zones,
      alertesSurpeche,
      anomalies: anomaliesEnv,
      radarPerformance,
      risquesIA12: iaRisques?.risquesDurabilite || risquesIA12.slice(0, 5),
      heatmap: { zones: topZones, mois: allMois, data: heatmapData }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDurabiliteStats };
