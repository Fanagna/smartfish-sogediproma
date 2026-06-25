/**
 * IA Context Service — Data fetcher mutualisé avec cache TTL
 * 
 * Évite de recharger les mêmes données à chaque appel Gemini.
 * Cache in-memory avec TTL configurable (5 minutes par défaut).
 * 
 * Utilisation :
 *   const ctx = require('./iaContextService');
 *   const data = await ctx.getFullContext(); // toutes les données
 *   const small = await ctx.getLightContext(); // données réduites
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');

// ─── Configuration du cache ───
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = {
  full: { data: null, timestamp: 0, ttl: DEFAULT_TTL_MS },
  light: { data: null, timestamp: 0, ttl: DEFAULT_TTL_MS },
  predictions: { data: null, timestamp: 0, ttl: DEFAULT_TTL_MS },
  fleet: { data: null, timestamp: 0, ttl: DEFAULT_TTL_MS },
};

function isCacheValid(entry) {
  return entry.data && (Date.now() - entry.timestamp) < entry.ttl;
}

function invalidateAll() {
  Object.keys(cache).forEach(key => { cache[key].timestamp = 0; });
  logger.debug('Cache IA context invalidé');
}

// ─── Context complet (toutes les entités) ───
// Utilisé par : getGlobalAnalysis, getStrategicRecommendations, analyzeRisks
async function getFullContext(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.full)) {
    logger.debug('[Cache] getFullContext → cache hit');
    return cache.full.data;
  }

  logger.debug('[Cache] getFullContext → fetch DB');
  const [captures, stocks, bateaux, maintenances, ventes, exportations, anomalies] = await Promise.all([
    prisma.capture.findMany({ take: 100, orderBy: { date: 'desc' } }),
    prisma.stock.findMany({ where: { dateSortie: null } }),
    prisma.bateau.findMany(),
    prisma.maintenance.findMany({ take: 50, orderBy: { date: 'desc' } }),
    prisma.vente.findMany({ take: 50, orderBy: { date: 'desc' } }),
    prisma.exportation.findMany({ take: 50, orderBy: { date: 'desc' } }),
    prisma.anomalie.findMany({ take: 50, orderBy: { date: 'desc' } }),
  ]);

  cache.full.data = { captures, stocks, bateaux, maintenances, ventes, exportations, anomalies };
  cache.full.timestamp = Date.now();
  return cache.full.data;
}

// ─── Context léger (captures, stocks, anomalies uniquement) ───
// Utilisé par : getPredictions, checkAnomalies, getRecommandations
async function getLightContext(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.light)) {
    logger.debug('[Cache] getLightContext → cache hit');
    return cache.light.data;
  }

  logger.debug('[Cache] getLightContext → fetch DB');
  const [captures, stocks] = await Promise.all([
    prisma.capture.findMany({ take: 50, orderBy: { date: 'desc' } }),
    prisma.stock.findMany({ where: { dateSortie: null } }),
  ]);

  cache.light.data = { captures, stocks };
  cache.light.timestamp = Date.now();
  return cache.light.data;
}

// ─── Context prédictions (captures, stocks, ventes, exports) ───
// Utilisé par : predictSales, predictExports
async function getPredictionsContext(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.predictions)) {
    logger.debug('[Cache] getPredictionsContext → cache hit');
    return cache.predictions.data;
  }

  logger.debug('[Cache] getPredictionsContext → fetch DB');
  const [ventes, exportations, stocks] = await Promise.all([
    prisma.vente.findMany({ take: 50, orderBy: { date: 'desc' } }),
    prisma.exportation.findMany({ take: 50, orderBy: { date: 'desc' } }),
    prisma.stock.findMany({ where: { dateSortie: null } }),
  ]);

  cache.predictions.data = { ventes, exportations, stocks };
  cache.predictions.timestamp = Date.now();
  return cache.predictions.data;
}

// ─── Context flotte (bateaux + captures + maintenance) ───
// Utilisé par : optimizeFleet, predictMaintenance
async function getFleetContext(forceRefresh = false) {
  if (!forceRefresh && isCacheValid(cache.fleet)) {
    logger.debug('[Cache] getFleetContext → cache hit');
    return cache.fleet.data;
  }

  logger.debug('[Cache] getFleetContext → fetch DB');
  const [bateaux, captures, maintenances] = await Promise.all([
    prisma.bateau.findMany({ include: { capitaine: true } }),
    prisma.capture.findMany({ take: 50, orderBy: { date: 'desc' }, include: { bateau: true } }),
    prisma.maintenance.findMany({ take: 50, orderBy: { date: 'desc' } }),
  ]);

  cache.fleet.data = { bateaux, captures, maintenances };
  cache.fleet.timestamp = Date.now();
  return cache.fleet.data;
}

// ─── Stats 30 jours (pour le chat) ───
async function getStats30j() {
  const date30DaysAgo = new Date();
  date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

  return prisma.capture.aggregate({
    where: { date: { gte: date30DaysAgo } },
    _sum: { poids: true, quantite: true },
    _count: { _all: true },
  });
}

module.exports = {
  getFullContext,
  getLightContext,
  getPredictionsContext,
  getFleetContext,
  getStats30j,
  invalidateAll,
};
