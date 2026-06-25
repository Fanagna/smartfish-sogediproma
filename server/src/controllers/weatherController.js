const { getAllZonesWeather, getWeatherForZone, invalidateCache, ZONES_COORDS } = require('../services/openMeteoService');
const logger = require('../utils/logger');

/**
 * GET /api/meteo
 * Récupère les données météo pour toutes les zones de Madagascar
 * Query params:
 *   - zone (optional): nom de la zone spécifique
 *   - force (optional): force le rafraîchissement du cache
 */
const getWeather = async (req, res, next) => {
  try {
    const { zone, force } = req.query;

    // Si une zone spécifique est demandée
    if (zone) {
      if (!ZONES_COORDS[zone]) {
        return res.status(404).json({
          error: `Zone '${zone}' introuvable`,
          zones_disponibles: Object.keys(ZONES_COORDS),
        });
      }
      const weather = await getWeatherForZone(zone);
      if (!weather) {
        // Fallback: données de simulation si l'API échoue
        return res.json({
          source: 'simulated',
          zone,
          coordinates: ZONES_COORDS[zone],
          message: 'API Open-Meteo indisponible, données simulées utilisées',
          weather: null,
        });
      }
      return res.json({
        source: 'open-meteo',
        zone,
        coordinates: ZONES_COORDS[zone],
        weather,
      });
    }

    // Toutes les zones
    const forceRefresh = force === 'true' || force === '1';
    const data = await getAllZonesWeather(forceRefresh);

    const successCount = Object.values(data.zones).filter(z => z !== null).length;
    const allFailed = successCount === 0;

    res.json({
      source: allFailed ? 'simulated' : 'open-meteo',
      total_zones: data.total,
      success_count: successCount,
      error_count: data.errors,
      fetched_at: data.fetchedAt,
      cached_until: data.cachedUntil,
      zones: data.zones,
      // Si toutes les zones ont échoué, indiquer le fallback
      message: allFailed
        ? 'API Open-Meteo momentanément indisponible — les données simulées seront utilisées côté client'
        : successCount < data.total
          ? `${data.errors} zone(s) en échec — données partielles`
          : undefined,
    });
  } catch (error) {
    logger.error(`Weather controller error: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/meteo/refresh
 * Invalide le cache et force un rafraîchissement
 */
const refreshWeather = async (req, res, next) => {
  try {
    invalidateCache();
    const data = await getAllZonesWeather(true);
    res.json({
      message: 'Cache invalidé et données rafraîchies',
      fetched_at: data.fetchedAt,
      zones_count: data.success,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWeather, refreshWeather };
