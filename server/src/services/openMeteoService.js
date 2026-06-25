// ─── Service Open-Meteo Marine API ───
// Appels à l'API gratuite Open-Meteo pour les données météo marines
// Documentation: https://open-meteo.com/en/docs/marine-weather-api

const https = require('https');
const logger = require('../utils/logger');

const OPEN_METEO_BASE = 'https://marine-api.open-meteo.com/v1/marine';

// Zones de pêche de Madagascar avec leurs coordonnées
const ZONES_COORDS = {
  'Plateau de Toliara': { lat: -23.35, lng: 43.52 },
  'Banc du Cap Saint-André': { lat: -17.20, lng: 43.80 },
  'Plateau de Majunga': { lat: -15.70, lng: 46.00 },
  'Canal de Mozambique Nord': { lat: -13.50, lng: 47.50 },
  'Banc du Leven': { lat: -12.50, lng: 48.20 },
  'Baie de Mahajamba': { lat: -15.20, lng: 46.80 },
  'Côte Est — Tamatave': { lat: -18.15, lng: 49.60 },
  'Côte Est — Mananara': { lat: -16.20, lng: 49.90 },
  'Sainte-Marie / Nosy Boraha': { lat: -16.90, lng: 50.20 },
  'Côte Est — Fort Dauphin': { lat: -25.00, lng: 47.10 },
  'Baie d\'Antongil': { lat: -15.80, lng: 50.00 },
  'Nosy Be — Archipel': { lat: -13.30, lng: 48.30 },
  'Antsiranana — Baie des Dunes': { lat: -12.20, lng: 49.30 },
  'Côte Sud — Cap Sainte Marie': { lat: -25.60, lng: 45.20 },
};

// ─── Cache en mémoire ───
let cache = {
  data: null,
  timestamp: 0,
  TTL: 60 * 60 * 1000, // 1 heure
};

/**
 * Fait un appel HTTP GET à l'API Open-Meteo
 */
function fetchFromOpenMeteo(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Open-Meteo API error ${res.statusCode}: ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse Open-Meteo response: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Récupère les données météo pour une zone spécifique
 */
async function getWeatherForZone(zoneName) {
  const coords = ZONES_COORDS[zoneName];
  if (!coords) return null;

  try {
    const url = `${OPEN_METEO_BASE}` +
      `?latitude=${coords.lat}` +
      `&longitude=${coords.lng}` +
      `&current=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction` +
      `&hourly=wave_height,sea_surface_temperature,wind_wave_height,swell_wave_height,ocean_current_velocity` +
      `&forecast_days=2` +
      `&timezone=Indian/Antananarivo` +
      `&cell_selection=sea`;

    const data = await fetchFromOpenMeteo(url);

    if (!data || data.error) {
      throw new Error(data?.reason || 'Empty response from Open-Meteo');
    }

    // Extraire les données courantes
    const current = data.current || {};
    const hourly = data.hourly || {};

    // Prendre les 24 prochaines heures pour les tendances
    const next24h = {
      times: hourly.time?.slice(0, 24) || [],
      wave_height: hourly.wave_height?.slice(0, 24) || [],
      sea_surface_temperature: hourly.sea_surface_temperature?.slice(0, 24) || [],
      wind_wave_height: hourly.wind_wave_height?.slice(0, 24) || [],
      swell_wave_height: hourly.swell_wave_height?.slice(0, 24) || [],
      ocean_current_velocity: hourly.ocean_current_velocity?.slice(0, 24) || [],
    };

    // Direction du vent = même provenance que les vagues (tous deux mesurés "from")
    const waveDir = current.wave_direction || 0;
    const windDirDeg = waveDir % 360;
    const dirMap = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const windDir = dirMap[Math.round(((windDirDeg % 360) / 45)) % 8];

    // Force du vent estimée à partir de la hauteur des vagues de vent
    const windWaveHeight = current.wind_wave_height || 0;
    const estimatedWindSpeed = Math.round(windWaveHeight * 8 + 5); // approximation

    const condition = estimatedWindSpeed < 15 ? 'Idéale'
      : estimatedWindSpeed < 25 ? 'Favorable'
      : estimatedWindSpeed < 35 ? 'Difficile'
      : 'Déconseillée';

    return {
      source: 'open-meteo',
      timestamp: data.generationtime_ms,
      temperature_mer: current.sea_surface_temperature
        ? Math.round(current.sea_surface_temperature * 10) / 10
        : null,
      vent_force: estimatedWindSpeed,
      vent_direction: windDir,
      hauteur_vagues: current.wave_height
        ? Math.round(current.wave_height * 10) / 10
        : null,
      hauteur_vagues_vent: current.wind_wave_height
        ? Math.round(current.wind_wave_height * 10) / 10
        : null,
      hauteur_vagues_swell: current.swell_wave_height
        ? Math.round(current.swell_wave_height * 10) / 10
        : null,
      direction_vagues: waveDir,
      periode_vagues: current.wave_period
        ? Math.round(current.wave_period * 10) / 10
        : null,
      courant_velocity: current.ocean_current_velocity
        ? Math.round(current.ocean_current_velocity * 10) / 10
        : null,
      courant_direction: current.ocean_current_direction || null,
      condition_peche: condition,
      next24h,
    };
  } catch (error) {
    logger.error(`Open-Meteo fetch failed for ${zoneName}: ${error.message}`);
    return null;
  }
}

/**
 * Récupère les données météo pour TOUTES les zones avec cache
 */
async function getAllZonesWeather(forceRefresh = false) {
  const now = Date.now();

  // Vérifier le cache
  if (!forceRefresh && cache.data && (now - cache.timestamp) < cache.TTL) {
    logger.info(`Returning cached weather data (${Math.round((now - cache.timestamp) / 1000)}s old)`);
    return cache.data;
  }

  logger.info('Fetching weather data from Open-Meteo for all zones...');

  // Récupérer toutes les zones en parallèle (max 5 à la fois pour éviter rate limiting)
  const results = {};
  const zoneNames = Object.keys(ZONES_COORDS);
  const batchSize = 5;

  for (let i = 0; i < zoneNames.length; i += batchSize) {
    const batch = zoneNames.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(name => getWeatherForZone(name))
    );

    batch.forEach((name, idx) => {
      const result = batchResults[idx];
      if (result.status === 'fulfilled' && result.value) {
        results[name] = result.value;
      } else {
        logger.warn(`Failed to fetch weather for ${name}: ${result.reason?.message || 'Unknown error'}`);
        results[name] = null;
      }
    });

    // Petit délai entre les batches pour éviter le rate limiting
    if (i + batchSize < zoneNames.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const successCount = Object.values(results).filter(r => r !== null).length;

  cache.data = {
    zones: results,
    total: zoneNames.length,
    success: successCount,
    errors: zoneNames.length - successCount,
    fetchedAt: new Date().toISOString(),
    cachedUntil: new Date(now + cache.TTL).toISOString(),
  };
  cache.timestamp = now;

  logger.info(`Weather fetch complete: ${successCount}/${zoneNames.length} zones successful`);
  return cache.data;
}

/**
 * Force le rafraîchissement du cache
 */
function invalidateCache() {
  cache.timestamp = 0;
  logger.info('Weather cache invalidated');
}

module.exports = {
  getAllZonesWeather,
  getWeatherForZone,
  invalidateCache,
  ZONES_COORDS,
};
