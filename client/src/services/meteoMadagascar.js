// ─── Service météo connecté — Open-Meteo via backend + fallback simulation ───
// 1. Appelle le backend SmartFish (/api/meteo)
// 2. Si échec, utilise les données simulées basées sur la climatologie

import api from './api'
import { ZONE_COORDS, getMeteoForZone, SAISONS_PECHE } from '../utils/madagascarZones'

// ─── État global du dernier chargement ───
let cachedRealData = null
let lastFetchTime = 0
const CLIENT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ─── API Status ───
export let apiStatus = {
  source: 'simulated', // 'open-meteo' | 'simulated'
  lastUpdate: null,
  zonesCount: 0,
  successCount: 0,
  errorCount: 0,
}

/**
 * Récupère les données météo réelles depuis le backend
 * avec cache côté client de 5 minutes
 */
async function fetchFromBackend(force = false) {
  const now = Date.now()

  if (!force && cachedRealData && (now - lastFetchTime) < CLIENT_CACHE_TTL) {
    return cachedRealData
  }

  try {
    const response = await api.get(`/meteo?force=${force}`)
    const data = response.data

    if (data && data.zones) {
      apiStatus = {
        source: 'open-meteo',
        lastUpdate: data.fetched_at,
        zonesCount: data.total_zones || 0,
        successCount: data.success_count || 0,
        errorCount: data.error_count || 0,
      }

      cachedRealData = data.zones
      lastFetchTime = now
      return data
    }
  } catch (err) {
    console.warn('[Météo] API backend indisponible, utilisation des données simulées:', err.message)
  }

  return null
}

/**
 * Obtient les conditions météo pour une zone spécifique
 * Utilise les données réelles si disponibles, sinon simulation
 */
export async function getWeatherForZone(zoneName) {
  // Essayer d'abord les données réelles en cache
  if (cachedRealData && cachedRealData[zoneName]) {
    const realData = cachedRealData[zoneName]
    if (realData) return { ...realData, source: 'open-meteo' }
  }

  // Sinon, essayer de charger depuis le backend
  const backendData = await fetchFromBackend()
  if (backendData?.zones?.[zoneName]) {
    const realData = backendData.zones[zoneName]
    if (realData) return { ...realData, source: 'open-meteo' }
  }

  // Fallback: données simulées
  const simulated = getMeteoForZone(zoneName)
  return simulated ? { ...simulated, source: 'simulated' } : null
}

/**
 * Obtient les conditions pour toutes les zones
 */
export async function getAllZonesWeather() {
  let totalReal = 0

  // Essayer de charger depuis le backend
  const backendData = await fetchFromBackend()
  const realZoneData = backendData?.zones || {}

  // Fusionner les données réelles avec la simulation (fallback)
  const result = {}
  Object.keys(ZONE_COORDS).forEach(zoneName => {
    if (realZoneData[zoneName]) {
      result[zoneName] = { ...realZoneData[zoneName], source: 'open-meteo' }
      totalReal++
    } else {
      const simulated = getMeteoForZone(zoneName)
      result[zoneName] = simulated ? { ...simulated, source: 'simulated' } : null
    }
  })

  if (totalReal > 0) {
    apiStatus.source = 'open-meteo'
    apiStatus.successCount = totalReal
  }

  return result
}

/**
 * Initialise le service météo (charge les données réelles au démarrage)
 */
export async function initMeteoService(force = false) {
  const backendData = await fetchFromBackend(force)
  if (backendData) {
    apiStatus = {
      source: 'open-meteo',
      lastUpdate: backendData.fetched_at,
      zonesCount: backendData.total_zones || 0,
      successCount: backendData.success_count || 0,
      errorCount: backendData.error_count || 0,
    }
    return true
  }

  // Si le backend est indisponible, on reste en mode simulé
  apiStatus.source = 'simulated'
  return false
}

// ─── Fonctions synchro (compatibles avec les composants existants) ───

export function getCurrentSeason() {
  const now = new Date()
  const month = now.getMonth()

  if (month >= 11 || month <= 1) return SAISONS_PECHE[2] // Repos biologique
  if (month >= 10 || month <= 3) return SAISONS_PECHE[1] // Pluies
  return SAISONS_PECHE[0] // Sèche
}

export function getBestZonesToday() {
  const season = getCurrentSeason()
  return season.zones_recommandees
    .map(name => {
      const zone = ZONE_COORDS[name]
      const meteo = getMeteoForZone(name)
      if (!zone || !meteo) return null
      return {
        nom: name,
        zone,
        meteo,
        score: meteo.condition_peche === 'Idéale' ? 100
          : meteo.condition_peche === 'Favorable' ? 75
          : meteo.condition_peche === 'Difficile' ? 40 : 15,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
}

export function getActiveWeatherAlerts() {
  const alerts = []
  const season = getCurrentSeason()

  if (season.nom === 'Repos biologique crevettier') {
    alerts.push({
      type: 'danger',
      message: 'Repos biologique — Pêche crevettière interdite (déc-fév)',
      zone: 'Toutes zones crevettières',
    })
  }

  Object.keys(ZONE_COORDS).forEach(name => {
    const meteo = getMeteoForZone(name)
    if (meteo?.alerte_cyclone) {
      alerts.push({ type: 'warning', message: `Risque cyclonique détecté — ${name}`, zone: name })
    }
    if (meteo?.condition_peche === 'Déconseillée') {
      alerts.push({
        type: 'warning',
        message: `Conditions dangereuses — ${name} (vent ${meteo.vent_force} km/h, vagues ${meteo.hauteur_vagues}m)`,
        zone: name,
      })
    }
  })

  return alerts
}
