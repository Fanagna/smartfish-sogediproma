import { useState, useEffect, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MADAGASCAR_CENTER, MADAGASCAR_ZOOM,
  ZONE_COORDS, MARINE_PROTECTED_AREAS,
  getSpeciesColor, getMeteoForZone,
} from '../../utils/madagascarZones'

// ─── Fix Leaflet default icon path ───
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Tiles disponibles ───
export const TILE_LAYERS = {
  standard: {
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
  topo: {
    name: 'Topographique',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
  },
}

// ─── Fallback coords (ocean around Madagascar) ───
const FALLBACK_COORDS = [
  { lat: -18.0, lng: 45.0 },
  { lat: -20.0, lng: 45.5 },
  { lat: -16.0, lng: 47.0 },
  { lat: -22.0, lng: 44.0 },
  { lat: -14.0, lng: 48.0 },
]

// ─── Stable jitter for capture markers ───
function jitterCoord(baseLat, baseLng, seed = 0, spread = 0.08) {
  const hash = (seed * 9301 + 49297) % 233280
  const r1 = hash / 233280
  const r2 = ((seed + 13) * 9301 + 49297) % 233280 / 233280
  return [
    baseLat + (r1 - 0.5) * spread,
    baseLng + (r2 - 0.5) * spread,
  ]
}

function getCapturePosition(zonePeche, index = 0) {
  const zone = ZONE_COORDS[zonePeche]
  if (zone) return jitterCoord(zone.lat, zone.lng, index)
  const fb = FALLBACK_COORDS[index % FALLBACK_COORDS.length]
  return jitterCoord(fb.lat, fb.lng, index, 0.15)
}

// ─── Icon factories ───
function createZoneIcon(color, isRecommended = false) {
  return L.divIcon({
    className: 'custom-marker-zone',
    html: `<div style="
      width: ${isRecommended ? 46 : 38}px; height: ${isRecommended ? 46 : 38}px;
      background: ${color};
      border: ${isRecommended ? '4px' : '3px'} solid white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 ${isRecommended ? 4 : 2}px ${isRecommended ? 16 : 10}px rgba(0,0,0,0.3);
      font-size: ${isRecommended ? 20 : 17}px;
      color: white;
      cursor: pointer;
      transition: transform 0.2s;
    ">🎣</div>`,
    iconSize: [isRecommended ? 46 : 38, isRecommended ? 46 : 38],
    iconAnchor: [isRecommended ? 23 : 19, isRecommended ? 23 : 19],
    popupAnchor: [0, isRecommended ? -27 : -23],
  })
}

function createCaptureIcon(color) {
  return L.divIcon({
    className: 'custom-marker-capture',
    html: `<div style="
      width: 13px; height: 13px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    "></div>`,
    iconSize: [13, 13],
    iconAnchor: [7, 7],
    popupAnchor: [0, -9],
  })
}

function createMeteoIcon(windDir, windForce) {
  const dirMap = { 'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315 }
  const deg = dirMap[windDir] || 0
  const size = Math.min(Math.max(windForce, 8), 24)
  const color = windForce < 15 ? '#22C55E' : windForce < 25 ? '#F59E0B' : '#EF4444'
  return L.divIcon({
    className: 'wind-arrow',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      display: flex; align-items: center; justify-content: center;
      font-size: ${size}px; color: ${color};
      transform: rotate(${deg}deg);
      opacity: 0.8;
      transition: opacity 0.3s;
    ">➡</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Weather overlay layer ───
function WeatherLayer({ visible }) {
  const map = useMap()

  useEffect(() => {
    if (!visible) return

    const markers = Object.entries(ZONE_COORDS).map(([name, zone]) => {
      const meteo = getMeteoForZone(name)
      if (!meteo) return null

      const marker = L.marker([zone.lat, zone.lng], {
        icon: createMeteoIcon(meteo.vent_direction, meteo.vent_force),
        interactive: false,
      })

      marker.bindTooltip(
        `<div style="font-family:sans-serif;font-size:11px;line-height:1.4">
          <b>${name}</b><br/>
          🌬️ ${meteo.vent_force} km/h ${meteo.vent_direction}<br/>
          🌡️ ${meteo.temperature_mer}°C · 🌊 ${meteo.hauteur_vagues}m<br/>
          📊 ${meteo.condition_peche}
        </div>`,
        { direction: 'top', className: 'meteo-tooltip' }
      )

      marker.addTo(map)
      return marker
    }).filter(Boolean)

    return () => markers.forEach(m => m.remove())
  }, [visible, map])

  return null
}

// ─── AMP (Marine Protected Areas) overlay ───
function MarineProtectedAreasLayer({ visible }) {
  const map = useMap()

  useEffect(() => {
    if (!visible) return

    const circles = MARINE_PROTECTED_AREAS.map(area => {
      const circle = L.circle([area.lat, area.lng], {
        radius: area.radius * 111000, // convert degrees to meters approx
        color: area.color,
        fillColor: area.color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6 4',
      })

      circle.bindTooltip(
        `<div style="font-family:sans-serif;font-size:11px;line-height:1.4">
          <b>🛡️ ${area.nom}</b><br/>
          ${area.desc}<br/>
          <span style="color:${area.color}">Niveau: ${area.niveau}</span>
        </div>`,
        { direction: 'top', className: 'amp-tooltip' }
      )

      circle.addTo(map)
      return circle
    })

    return () => circles.forEach(c => c.remove())
  }, [visible, map])

  return null
}

// ─── Heatmap layer ───
function HeatmapLayer({ captures, visible }) {
  const map = useMap()

  useEffect(() => {
    if (!visible || !captures?.length) return

    const gridSize = 0.15
    const grid = {}

    captures.forEach((c, i) => {
      const [lat, lng] = getCapturePosition(c.zonePeche, i)
      const key = `${Math.round(lat / gridSize)},${Math.round(lng / gridSize)}`
      if (!grid[key]) {
        grid[key] = {
          lat: Math.round(lat / gridSize) * gridSize,
          lng: Math.round(lng / gridSize) * gridSize,
          count: 0, poids: 0,
        }
      }
      grid[key].count += c.quantite || 1
      grid[key].poids += c.poids || 0
    })

    const maxCount = Math.max(...Object.values(grid).map(g => g.count), 1)
    const circles = Object.values(grid).map(cell => {
      const intensity = cell.count / maxCount
      const radius = Math.max(10, intensity * 45)
      const opacity = Math.max(0.15, intensity * 0.65)

      const circle = L.circleMarker([cell.lat, cell.lng], {
        radius,
        color: intensity > 0.6 ? '#EF4444' : intensity > 0.3 ? '#F97316' : '#FBB13C',
        fillColor: intensity > 0.6 ? '#DC2626' : intensity > 0.3 ? '#EA580C' : '#D97706',
        fillOpacity: opacity,
        weight: 0,
        interactive: false,
      })
      circle.bindTooltip(
        `${cell.count} captures · ${cell.poids.toFixed(0)} kg`,
        { direction: 'top', className: 'heatmap-tooltip' }
      )
      circle.addTo(map)
      return circle
    })

    return () => circles.forEach(c => c.remove())
  }, [captures, visible, map])

  return null
}

// ─── Fly-to control ───
function FlyToControl({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 10, { duration: 1.0 })
  }, [target, map])
  return null
}

// ─── Main MapView component ───
export default function MapView({
  captures = [],
  zones = [],
  showCaptures = true,
  showZones = true,
  showHeatmap = false,
  showWeather = false,
  showAMP = false,
  tileLayer = 'standard',
  onZoneClick,
  onCaptureClick,
  flyToZone,
  height = 520,
  className = '',
}) {
  const [map, setMap] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [hoveredZone, setHoveredZone] = useState(null)

  useEffect(() => {
    if (flyToZone && ZONE_COORDS[flyToZone]) {
      setFlyTarget([ZONE_COORDS[flyToZone].lat, ZONE_COORDS[flyToZone].lng])
    } else if (flyToZone === null) {
      setFlyTarget(null)
    }
  }, [flyToZone])

  const tileConfig = TILE_LAYERS[tileLayer] || TILE_LAYERS.standard

  const zoneMarkers = useMemo(() => {
    if (!showZones) return []
    return zones.map((zone, i) => {
      const coords = ZONE_COORDS[zone.nom]
      if (!coords) return null
      return { zone, coords, index: i }
    }).filter(Boolean)
  }, [zones, showZones])

  const staticZoneMarkers = useMemo(() => {
    if (!showZones) return []
    // Show all registered zones
    return Object.entries(ZONE_COORDS).map(([nom, coords], i) => ({
      nom,
      coords,
      isStatic: true,
    }))
  }, [showZones])

  const captureMarkers = useMemo(() => {
    if (!showCaptures) return []
    return captures.map((c, i) => {
      const pos = getCapturePosition(c.zonePeche, i)
      return {
        capture: c,
        position: pos,
        color: getSpeciesColor(c.espece),
      }
    })
  }, [captures, showCaptures])

  return (
    <div className={`rounded-xl overflow-hidden border border-theme/20 shadow-lg ${className}`} style={{ height }}>
      {typeof window !== 'undefined' && (
        <MapContainer
          center={MADAGASCAR_CENTER}
          zoom={MADAGASCAR_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          ref={setMap}
          minZoom={5}
          maxBounds={[[-27, 40], [-10, 53]]}
        >
          <TileLayer
            attribution={tileConfig.attribution}
            url={tileConfig.url}
          />

          <FlyToControl target={flyTarget} />
          <WeatherLayer visible={showWeather} />
          <MarineProtectedAreasLayer visible={showAMP} />
          <HeatmapLayer captures={captures} visible={showHeatmap} />

          {/* ─── All Madagascar Fishing Zones ─── */}
          {showZones && staticZoneMarkers.map(({ nom, coords }) => {
            const meteo = getMeteoForZone(nom)
            return (
              <Marker
                key={`zone-${nom}`}
                position={[coords.lat, coords.lng]}
                icon={createZoneIcon(coords.color, true)}
                eventHandlers={{
                  click: () => onZoneClick?.(nom),
                  mouseover: () => setHoveredZone(nom),
                  mouseout: () => setHoveredZone(null),
                }}
              >
                <Popup maxWidth={320}>
                  <div className="font-sans" style={{ minWidth: 240 }}>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                        style={{ backgroundColor: coords.color }}
                      >
                        🎣
                      </span>
                      <div>
                        <h4 className="font-bold text-theme-primary text-sm">{nom}</h4>
                        <p className="text-[10px] text-theme-secondary">{coords.desc.substring(0, 80)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-primary/5 rounded-lg p-2">
                        <p className="text-[9px] text-theme-secondary">🌡️ Mer</p>
                        <p className="text-sm font-bold text-theme-primary">{meteo?.temperature_mer ?? '—'}°C</p>
                      </div>
                      <div className="bg-success/5 rounded-lg p-2">
                        <p className="text-[9px] text-theme-secondary">🌬️ Vent</p>
                        <p className="text-sm font-bold text-theme-primary">{meteo?.vent_force ?? '—'} km/h</p>
                      </div>
                      <div className="bg-warning/5 rounded-lg p-2">
                        <p className="text-[9px] text-theme-secondary">🌊 Vagues</p>
                        <p className="text-sm font-bold text-theme-primary">{meteo?.hauteur_vagues ?? '—'} m</p>
                      </div>
                      <div className="bg-accent/5 rounded-lg p-2">
                        <p className="text-[9px] text-theme-secondary">📊 Condition</p>
                        <p className="text-sm font-bold text-theme-primary">{meteo?.condition_peche ?? '—'}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-theme-secondary">
                      <p><span className="font-semibold text-theme-primary">Espèces :</span> {coords.especes.join(', ')}</p>
                      <p><span className="font-semibold text-theme-primary">Saison :</span> {coords.saison}</p>
                      <p><span className="font-semibold text-theme-primary">Profondeur :</span> {coords.profondeur}</p>
                      <p><span className="font-semibold text-theme-primary">Ports :</span> {coords.ports.join(', ')}</p>
                      <p className="text-[10px] text-theme-tertiary mt-1 italic">{coords.reglementation}</p>
                    </div>

                    {meteo?.alerte_cyclone && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5">
                        <span className="text-red-500 text-sm">⚠️</span>
                        <span className="text-[10px] text-red-700 font-medium">Alerte cyclonique — conditions dangereuses</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* ─── AI Recommended Zones ─── */}
          {zoneMarkers.map(({ zone, coords, index }) => (
            <Marker
              key={`ai-zone-${index}`}
              position={[coords.lat, coords.lng]}
              icon={createZoneIcon(coords.color, true)}
              eventHandlers={{ click: () => onZoneClick?.(zone.nom) }}
            >
              <Popup>
                <div className="font-sans" style={{ minWidth: 200 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <h4 className="font-bold text-theme-primary text-sm">{zone.nom}</h4>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p><span className="font-semibold">Espèce :</span> {zone.espece}</p>
                    <p><span className="font-semibold">Moment :</span> {zone.moment || '—'}</p>
                    <p className="text-theme-secondary mt-1 italic">{zone.justification?.substring(0, 150)}...</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ─── Capture Markers ─── */}
          {captureMarkers.map(({ capture, position, color }, i) => (
            <Marker
              key={`capture-${capture.id || i}`}
              position={position}
              icon={createCaptureIcon(color)}
              eventHandlers={{ click: () => onCaptureClick?.(capture) }}
            >
              <Popup>
                <div className="font-sans" style={{ minWidth: 160 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <h4 className="font-bold text-theme-primary text-sm">{capture.espece}</h4>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p><span className="font-semibold">Poids :</span> {capture.poids?.toFixed(1)} kg</p>
                    <p><span className="font-semibold">Quantité :</span> {capture.quantite}</p>
                    {capture.zonePeche && <p><span className="font-semibold">Zone :</span> {capture.zonePeche}</p>}
                    {capture.bateau?.nom && <p><span className="font-semibold">Bateau :</span> {capture.bateau.nom}</p>}
                    {capture.date && (
                      <p className="text-theme-tertiary mt-1">
                        {new Date(capture.date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  )
}
