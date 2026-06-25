import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getZonesPeche } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ZONE_COORDS, MADAGASCAR_CENTER, MADAGASCAR_ZOOM,
  getSpeciesColor, getMeteoForZone,
} from '../../utils/madagascarZones'
import { getCurrentSeason } from '../../services/meteoMadagascar'
import {
  FiMapPin, FiNavigation, FiAnchor, FiTarget, FiClock,
  FiMessageCircle, FiRefreshCw, FiInfo, FiWind, FiThermometer,
} from 'react-icons/fi'

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createMarkerIcon(color) {
  return L.divIcon({
    className: 'custom-marker-zone',
    html: `<div style="
      width: 40px; height: 40px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      font-size: 18px;
      color: white;
      cursor: pointer;
    ">🎣</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  })
}

function FlyToZone({ zone }) {
  const map = useMap()
  useEffect(() => {
    if (zone && ZONE_COORDS[zone]) {
      map.flyTo([ZONE_COORDS[zone].lat, ZONE_COORDS[zone].lng], 10, { duration: 1.2 })
    }
  }, [zone, map])
  return null
}

export default function ZonesPeche() {
  const [selectedZone, setSelectedZone] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const season = getCurrentSeason()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['zones-peche'],
    queryFn: getZonesPeche,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  })

  const zones = data?.zones || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Zones de Pêche IA</p>
            <p className="text-sm text-theme-secondary mt-1">Analyse des zones optimales autour de Madagascar...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <FiInfo className="w-16 h-16 mx-auto text-danger mb-4" />
          <p className="text-xl font-bold text-danger mb-2">Erreur de chargement</p>
          <p className="text-theme-secondary mb-4">{error?.message}</p>
          <button onClick={() => refetch()}
            className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            <FiRefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-success/20 to-blue-500/20 rounded-2xl">
              <FiNavigation className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Zones de Pêche</h1>
            <span className="px-2.5 py-1 bg-success/10 text-success rounded-full text-xs font-semibold">IA</span>
          </div>
          <p className="text-theme-secondary ml-1">
            Zones recommandées par l'IA sur la carte de Madagascar — {Object.keys(ZONE_COORDS).length} zones disponibles
          </p>
        </div>
        <button onClick={() => refetch()}
          className="p-2.5 text-theme-secondary hover:text-success hover:bg-success/10 rounded-xl transition-all"
          title="Actualiser"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPIs avec saison */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiNavigation className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Zones recommandées</p>
              <p className="text-2xl font-bold text-theme-primary">{zones.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiMapPin className="w-5 h-5 text-accent" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Espèces ciblées</p>
              <p className="text-2xl font-bold text-theme-primary">{new Set(zones.map(z => z.espece)).size}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiClock className="w-5 h-5 text-warning" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Saison</p>
              <p className="text-2xl font-bold text-theme-primary">{season.icone}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl"><FiTarget className="w-5 h-5 text-blue-500" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Région</p>
              <p className="text-2xl font-bold text-theme-primary text-sm">Madagascar</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Carte avec toutes les zones Madagascar ─── */}
      <Card variant="glass">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-success/20 to-blue-500/5 rounded-xl">
            <FiMapPin className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-theme-primary">Zones de pêche de Madagascar</h3>
            <p className="text-xs text-theme-secondary">
              {season.nom} — {season.conditions} • Cliquez sur un marqueur 🎣 pour voir les détails
            </p>
          </div>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-theme-tertiary hover:text-accent underline">© OpenStreetMap</a>
        </div>
        <div className="rounded-xl overflow-hidden border border-theme" style={{ height: 480 }}>
          {typeof window !== 'undefined' && (
            <MapContainer
              center={MADAGASCAR_CENTER}
              zoom={MADAGASCAR_ZOOM}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={true}
              minZoom={5}
              maxBounds={[[-27, 40], [-10, 53]]}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyToZone zone={selectedZone} />

              {/* Toutes les zones de Madagascar */}
              {Object.entries(ZONE_COORDS).map(([nom, coords]) => {
                const meteo = getMeteoForZone(nom)
                return (
                  <Marker
                    key={nom}
                    position={[coords.lat, coords.lng]}
                    icon={createMarkerIcon(coords.color)}
                    eventHandlers={{ click: () => setSelectedZone(nom) }}
                  >
                    <Popup maxWidth={300}>
                      <div className="font-sans" style={{ minWidth: 220 }}>
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-theme-subtle">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                            style={{ backgroundColor: coords.color }}>
                            🎣
                          </div>
                          <div>
                            <h4 className="font-bold text-theme-primary text-sm">{nom}</h4>
                            <p className="text-[9px] text-theme-secondary">{coords.desc.substring(0, 60)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mb-2 text-xs">
                          <div className="bg-blue-50 rounded p-1.5">
                            🌡️ {meteo?.temperature_mer ?? '—'}°C
                          </div>
                          <div className="bg-green-50 rounded p-1.5">
                            🌬️ {meteo?.vent_force ?? '—'} km/h
                          </div>
                          <div className="bg-amber-50 rounded p-1.5">
                            🌊 {meteo?.hauteur_vagues ?? '—'}m
                          </div>
                          <div className="bg-purple-50 rounded p-1.5 font-medium" style={{ color: coords.color }}>
                            {meteo?.condition_peche ?? '—'}
                          </div>
                        </div>
                        <div className="space-y-0.5 text-[10px] text-theme-secondary">
                          <p>🎯 {coords.especes.slice(0, 3).join(', ')}...</p>
                          <p>⚓ {coords.ports.join(', ')}</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {/* Zones recommandées par l'IA */}
              {zones.map((zone, i) => {
                const coords = ZONE_COORDS[zone.nom]
                if (!coords) return null
                return (
                  <Marker
                    key={`ai-${i}`}
                    position={[coords.lat, coords.lng]}
                    icon={createMarkerIcon(coords.color)}
                    eventHandlers={{ click: () => setSelectedZone(zone.nom) }}
                  >
                    <Popup>
                      <div className="font-sans min-w-[180px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🤖</span>
                          <h4 className="font-bold text-theme-primary text-sm">{zone.nom}</h4>
                        </div>
                        <div className="space-y-1 text-xs">
                          <p><span className="font-semibold">Espèce :</span> {zone.espece}</p>
                          <p><span className="font-semibold">Moment :</span> {zone.moment || '—'}</p>
                          <p className="text-theme-secondary mt-1 italic">{zone.justification?.substring(0, 100)}...</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          )}
        </div>
      </Card>

      {/* ─── Zone Detail Panel ─── */}
      {selectedZone && (() => {
        const zone = zones.find(z => z.nom === selectedZone)
        const coords = ZONE_COORDS[selectedZone]
        const meteo = getMeteoForZone(selectedZone)
        if (!coords) return null
        return (
          <Card variant="glass">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md text-white text-xl"
                  style={{ backgroundColor: coords.color }}>
                  🎣
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-primary">{selectedZone}</h3>
                  <p className="text-xs text-theme-secondary">{coords.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] text-theme-tertiary bg-theme-surface px-2 py-1 rounded-full">
                  {Math.abs(coords.lat).toFixed(2)}°{coords.lat < 0 ? 'S' : 'N'}, {coords.lng.toFixed(2)}°E
                </span>
                <button onClick={() => setSelectedZone(null)}
                  className="p-1.5 text-theme-tertiary hover:text-danger rounded-lg hover:bg-danger/10">
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Météo */}
            {meteo && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-2.5 bg-blue-50 rounded-xl text-center">
                  <p className="text-[9px] text-theme-secondary">🌡️ Mer</p>
                  <p className="text-sm font-bold">{meteo.temperature_mer}°C</p>
                </div>
                <div className="p-2.5 bg-green-50 rounded-xl text-center">
                  <p className="text-[9px] text-theme-secondary">🌬️ Vent</p>
                  <p className="text-sm font-bold">{meteo.vent_force} km/h</p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl text-center">
                  <p className="text-[9px] text-theme-secondary">🌊 Vagues</p>
                  <p className="text-sm font-bold">{meteo.hauteur_vagues} m</p>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-xl text-center">
                  <p className="text-[9px] text-theme-secondary">📊 État</p>
                  <p className="text-sm font-bold">{meteo.condition_peche}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                <p className="text-xs text-theme-secondary mb-1">Espèces présentes</p>
                <p className="text-sm font-bold text-theme-primary">{coords.especes.join(', ')}</p>
              </div>
              <div className="p-4 bg-warning/5 rounded-xl border border-warning/10">
                <p className="text-xs text-theme-secondary mb-1">Saison recommandée</p>
                <p className="text-sm font-semibold text-theme-primary">{coords.saison}</p>
              </div>
              <div className="p-4 bg-success/5 rounded-xl border border-success/10 sm:col-span-2 lg:col-span-1">
                <p className="text-xs text-theme-secondary mb-1">Ports</p>
                <p className="text-sm text-theme-primary">{coords.ports.join(', ')}</p>
              </div>
            </div>

            {zone && zone.justification && (
              <div className="mt-4 p-4 bg-theme-surface rounded-xl">
                <p className="text-xs text-theme-secondary mb-1 flex items-center gap-1.5">
                  <FiMessageCircle className="w-3 h-3 text-success" />
                  Justification IA
                </p>
                <p className="text-sm text-theme-primary">{zone.justification}</p>
              </div>
            )}
          </Card>
        )
      })()}

      {/* ─── Zone Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone, i) => {
          const isExpanded = expandedCard === i
          const coords = ZONE_COORDS[zone.nom]
          const color = coords?.color || '#0B4F6C'
          return (
            <Card key={i} variant="glass" className={`!p-5 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all ${isExpanded ? 'ring-2 ring-success' : ''}`}
              onClick={() => {
                setExpandedCard(isExpanded ? null : i)
                setSelectedZone(zone.nom)
              }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white text-lg"
                  style={{ backgroundColor: color }}>
                  🎣
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-theme-primary text-lg">{zone.nom}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}>
                      Zone {i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-theme-secondary flex items-center gap-1.5 mb-2">
                    <FiTarget className="w-3.5 h-3.5 text-accent shrink-0" />
                    {zone.espece}
                  </p>
                  <p className="text-xs text-theme-secondary flex items-start gap-1.5">
                    <FiClock className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                    {zone.moment}
                  </p>
                  {coords && (
                    <p className="text-[10px] text-theme-tertiary mt-1">
                      {Math.abs(coords.lat).toFixed(2)}°{coords.lat < 0 ? 'S' : 'N'}, {coords.lng.toFixed(2)}°E
                    </p>
                  )}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-theme-subtle animate-fadeIn">
                      <p className="text-xs text-theme-secondary mb-1 flex items-center gap-1.5">
                        <FiMessageCircle className="w-3 h-3 text-success shrink-0" />
                        Justification IA
                      </p>
                      <p className="text-sm text-theme-primary bg-theme-surface rounded-lg p-3">{zone.justification}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ─── Info ─── */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-gradient-to-br from-success/10 to-blue-500/10 rounded-xl shrink-0">
            <FiNavigation className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">Zones de pêche de Madagascar</h3>
            <p className="text-sm text-theme-secondary">
              Cette page affiche les <strong>{Object.keys(ZONE_COORDS).length} zones de pêche réelles</strong> de Madagascar
              (Canal de Mozambique, côte Est, Nord, Sud) superposées aux recommandations de l'IA.
              Les données météo sont basées sur la climatologie réelle (alizés, mousson, températures de saison).
              L'IA analyse les captures récentes pour recommander les zones optimales en fonction des espèces ciblées.
            </p>
            <div className="flex gap-3 mt-2 text-[10px] text-theme-tertiary">
              <span>📍 {Object.keys(ZONE_COORDS).length} zones</span>
              <span>🌬️ Saison : {season.nom}</span>
              <span>🤖 Analyse IA : Gemini</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
