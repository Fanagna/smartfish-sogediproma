import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import MapView, { TILE_LAYERS } from '../components/charts/MapView'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { getCaptures } from '../services/capturesService'
import { getZonesPeche } from '../services/iaService'
import {
  ZONE_COORDS, MADAGASCAR_ESPECES,
  getSpeciesColor, MARINE_PROTECTED_AREAS,
  SAISONS_PECHE, getMeteoForZone,
} from '../utils/madagascarZones'
import {
  getCurrentSeason, getBestZonesToday,
  getActiveWeatherAlerts, getAllZonesWeather,
  initMeteoService,
} from '../services/meteoMadagascar'
import {
  FiMapPin, FiDroplet, FiNavigation, FiTarget, FiRefreshCw,
  FiFilter, FiInfo, FiGrid, FiMaximize2, FiMinimize2,
  FiX, FiWind, FiCloud, FiAnchor, FiShield,
  FiChevronDown, FiChevronUp, FiAlertTriangle, FiCalendar,
  FiTrendingUp,
} from 'react-icons/fi'

// ─── Capture detail panel ───
function CaptureDetail({ capture, onClose }) {
  const zone = ZONE_COORDS[capture.zonePeche]
  return (
    <Card variant="glass" className="!p-5 !pb-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full inline-block shadow-sm"
            style={{ backgroundColor: getSpeciesColor(capture.espece) }}
          />
          <h3 className="text-lg font-bold text-theme-primary">{capture.espece}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 text-theme-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-all">
          <FiX className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="p-3 bg-theme-surface rounded-xl">
          <p className="text-xs text-theme-secondary">Poids</p>
          <p className="font-bold text-theme-primary">{capture.poids?.toFixed(1)} kg</p>
        </div>
        <div className="p-3 bg-theme-surface rounded-xl">
          <p className="text-xs text-theme-secondary">Quantité</p>
          <p className="font-bold text-theme-primary">{capture.quantite}</p>
        </div>
        {capture.zonePeche && (
          <div className="p-3 bg-theme-surface rounded-xl">
            <p className="text-xs text-theme-secondary">Zone</p>
            <p className="font-bold text-theme-primary">{capture.zonePeche}</p>
          </div>
        )}
        {capture.bateau?.nom && (
          <div className="p-3 bg-theme-surface rounded-xl">
            <p className="text-xs text-theme-secondary">Bateau</p>
            <p className="font-bold text-theme-primary">{capture.bateau.nom}</p>
          </div>
        )}
        {capture.date && (
          <div className="p-3 bg-theme-surface rounded-xl">
            <p className="text-xs text-theme-secondary">Date</p>
            <p className="font-bold text-theme-primary text-sm">
              {new Date(capture.date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}
        {zone && (
          <div className="p-3 bg-theme-surface rounded-xl">
            <p className="text-xs text-theme-secondary">Coordonnées</p>
            <p className="font-bold text-theme-primary text-xs">
              {Math.abs(zone.lat).toFixed(2)}°{zone.lat < 0 ? 'S' : 'N'}, {zone.lng.toFixed(2)}°E
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function Cartographie() {
  // ─── State ───
  const [showCaptures, setShowCaptures] = useState(true)
  const [showZones, setShowZones] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showWeather, setShowWeather] = useState(true)
  const [showAMP, setShowAMP] = useState(false)
  const [tileLayer, setTileLayer] = useState('standard')
  const [filterEspece, setFilterEspece] = useState('')
  const [filterZone, setFilterZone] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedZoneInfo, setSelectedZoneInfo] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [selectedCapture, setSelectedCapture] = useState(null)
  const [showWeatherPanel, setShowWeatherPanel] = useState(true)
  const [showSeasonsPanel, setShowSeasonsPanel] = useState(true)
  const [showTileMenu, setShowTileMenu] = useState(false)
  const [weatherSource, setWeatherSource] = useState('simulated')
  const [realWeatherData, setRealWeatherData] = useState({})

  // ─── Initialiser le service météo (API réelle avec fallback) ───
  useEffect(() => {
    initMeteoService().then(success => {
      setWeatherSource(success ? 'open-meteo' : 'simulated')
      if (success) {
        getAllZonesWeather().then(data => {
          if (Object.values(data).some(d => d?.source === 'open-meteo')) {
            setRealWeatherData(data)
          }
        })
      }
    })
  }, [])

  // ─── Current season & weather data ───
  const currentSeason = useMemo(() => getCurrentSeason(), [])
  const weatherAlerts = useMemo(() => getActiveWeatherAlerts(), [])
  const bestZones = useMemo(() => getBestZonesToday(), [])

  // ─── Fetch captures ───
  const { data: capturesData, isLoading: loadingCaptures, isError: errorCaptures, refetch: refetchCaptures } = useQuery({
    queryKey: ['captures-map'],
    queryFn: () => getCaptures({ limit: 500, page: 1 }),
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  // ─── Fetch IA zones ───
  const { data: zonesData, isLoading: loadingZones, isError: errorZones, refetch: refetchZones } = useQuery({
    queryKey: ['zones-peche'],
    queryFn: getZonesPeche,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  })

  const captures = capturesData?.captures || []
  const totalCaptures = capturesData?.total || captures.length
  const zones = zonesData?.zones || []

  // ─── Filtered captures ───
  const filteredCaptures = useMemo(() => {
    let result = captures
    if (filterEspece) result = result.filter(c => c.espece === filterEspece)
    if (filterZone) result = result.filter(c => c.zonePeche === filterZone)
    return result
  }, [captures, filterEspece, filterZone])

  // ─── Stats ───
  const stats = useMemo(() => {
    const totalPoids = filteredCaptures.reduce((s, c) => s + (c.poids || 0), 0)
    const totalQuantite = filteredCaptures.reduce((s, c) => s + (c.quantite || 0), 0)
    const especes = new Set(filteredCaptures.map(c => c.espece)).size
    const zonesCount = new Set(filteredCaptures.map(c => c.zonePeche).filter(Boolean)).size
    return { totalPoids, totalQuantite, especes, zonesCount }
  }, [filteredCaptures])

  // ─── Species distribution ───
  const speciesDist = useMemo(() => {
    const map = {}
    filteredCaptures.forEach(c => {
      if (!map[c.espece]) map[c.espece] = { poids: 0, quantite: 0, count: 0 }
      map[c.espece].poids += c.poids || 0
      map[c.espece].quantite += c.quantite || 0
      map[c.espece].count += 1
    })
    return Object.entries(map)
      .map(([espece, data]) => ({ espece, ...data }))
      .sort((a, b) => b.poids - a.poids)
      .slice(0, 10)
  }, [filteredCaptures])

  // ─── Zone distribution ───
  const zoneDist = useMemo(() => {
    const map = {}
    filteredCaptures.forEach(c => {
      const zone = c.zonePeche || 'Inconnue'
      if (!map[zone]) map[zone] = { poids: 0, count: 0 }
      map[zone].poids += c.poids || 0
      map[zone].count += 1
    })
    return Object.entries(map)
      .map(([zone, data]) => ({ zone, ...data }))
      .sort((a, b) => b.poids - a.poids)
  }, [filteredCaptures])

  // ─── Update selected zone info ───
  useEffect(() => {
    if (selectedZone && ZONE_COORDS[selectedZone]) {
      setSelectedZoneInfo(ZONE_COORDS[selectedZone])
    } else {
      setSelectedZoneInfo(null)
    }
  }, [selectedZone])

  const isLoading = loadingCaptures || loadingZones
  const isError = errorCaptures || errorZones

  const handleRefresh = () => {
    refetchCaptures()
    refetchZones()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Cartographie</p>
            <p className="text-sm text-theme-secondary mt-1">Chargement des données spatiales...</p>
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
          <p className="text-theme-secondary mb-4">Impossible de charger les données cartographiques.</p>
          <button onClick={handleRefresh} className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all shadow-lg flex items-center gap-2 mx-auto">
            <FiRefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-5 animate-fadeIn pb-12 ${fullscreen ? 'fixed inset-0 z-50 bg-theme-elevated p-4 overflow-auto' : ''}`}>
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
              <FiMapPin className="w-7 h-7 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Cartographie</h1>
            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-semibold">
              Madagascar
            </span>
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
              weatherSource === 'open-meteo'
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-amber-500/10 text-amber-600'
            }`}>
              {weatherSource === 'open-meteo' ? '🛰️' : '💻'}
              {weatherSource === 'open-meteo' ? 'Open-Meteo' : 'Simulé'}
            </span>
          </div>
          <p className="text-theme-secondary ml-1">
            Zones de pêche réelles • Données météo ({weatherSource === 'open-meteo' ? 'Open-Meteo' : 'simulation'}) • {Object.keys(ZONE_COORDS).length} zones • {totalCaptures} captures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-sm ${
              showFilters ? 'bg-accent/10 text-accent' : 'text-theme-secondary hover:bg-theme-surface'
            }`}
            title="Filtres"
          >
            <FiFilter className="w-4 h-4" />
            {(filterEspece || filterZone) && <span className="w-2 h-2 bg-accent rounded-full" />}
          </button>
          <button onClick={handleRefresh}
            className="p-2.5 text-theme-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
            title="Actualiser"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ═══ SAISON & ALERTS BANNER ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Saison actuelle */}
        <Card variant="glass" className="!p-4 !pb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${
              currentSeason.nom === 'Saison sèche' ? 'bg-amber-500/10' :
              currentSeason.nom === 'Saison des pluies' ? 'bg-blue-500/10' : 'bg-red-500/10'
            }`}>
              <span className="text-xl">{currentSeason.icone}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-theme-primary">{currentSeason.nom}</p>
                <span className="text-[10px] text-theme-muted">{currentSeason.periode}</span>
              </div>
              <p className="text-xs text-theme-secondary mb-1">{currentSeason.conditions}</p>
              <div className="flex items-center gap-3 text-[10px] text-theme-muted">
                <span>🌬️ {currentSeason.vent_moyen}</span>
                <span>🌡️ {currentSeason.temp_mer_moy}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Alertes météo */}
        <Card variant="glass" className="!p-4 !pb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${
              weatherAlerts.length > 0 ? 'bg-danger/10' : 'bg-success/10'
            }`}>
              {weatherAlerts.length > 0
                ? <FiAlertTriangle className="w-5 h-5 text-danger" />
                : <FiShield className="w-5 h-5 text-success" />
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-theme-primary mb-1">
                {weatherAlerts.length > 0 ? `${weatherAlerts.length} alerte(s) active(s)` : 'Aucune alerte'}
              </p>
              <div className="space-y-1">
                {weatherAlerts.slice(0, 2).map((a, i) => (
                  <p key={i} className={`text-xs ${a.type === 'danger' ? 'text-danger' : 'text-warning'}`}>
                    {a.type === 'danger' ? '🔴' : '🟡'} {a.message}
                  </p>
                ))}
                {weatherAlerts.length > 2 && (
                  <p className="text-[10px] text-theme-muted">+{weatherAlerts.length - 2} autres alertes</p>
                )}
                {weatherAlerts.length === 0 && (
                  <p className="text-xs text-theme-secondary">Conditions normales sur toutes les zones</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Meilleures zones du jour */}
        <Card variant="glass" className="!p-4 !pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl">
              <FiTrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-theme-primary mb-1">Meilleures zones aujourd'hui</p>
              <div className="space-y-1">
                {bestZones.slice(0, 3).map((z, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <p className="text-xs text-theme-secondary">{z.nom}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      z.score >= 80 ? 'bg-success/10 text-success' :
                      z.score >= 50 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                    }`}>
                      {z.meteo.condition_peche}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ KPIs ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiDroplet className="w-5 h-5 text-accent" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Captures</p>
              <p className="text-2xl font-bold text-theme-primary">{filteredCaptures.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiNavigation className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Poids total</p>
              <p className="text-2xl font-bold text-theme-primary">{stats.totalPoids.toFixed(0)} kg</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiTarget className="w-5 h-5 text-warning" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Espèces</p>
              <p className="text-2xl font-bold text-theme-primary">{stats.especes}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl"><FiGrid className="w-5 h-5 text-blue-500" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Zones de pêche</p>
              <p className="text-2xl font-bold text-theme-primary">{Object.keys(ZONE_COORDS).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ FILTERS ═══ */}
      {showFilters && (
        <Card variant="glass" className="!p-4 animate-fadeIn">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-theme-secondary mb-1.5">Espèce</label>
              <select value={filterEspece} onChange={e => setFilterEspece(e.target.value)}
                className="w-full px-3 py-2.5 bg-theme-elevated border border-theme rounded-xl text-sm text-theme-secondary focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all"
              >
                <option value="">Toutes les espèces</option>
                {MADAGASCAR_ESPECES.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-theme-secondary mb-1.5">Zone de pêche</label>
              <select value={filterZone} onChange={e => setFilterZone(e.target.value)}
                className="w-full px-3 py-2.5 bg-theme-elevated border border-theme rounded-xl text-sm text-theme-secondary focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all"
              >
                <option value="">Toutes les zones</option>
                {Object.entries(ZONE_COORDS).map(([nom, data]) => (
                  <option key={nom} value={nom}>{nom}</option>
                ))}
              </select>
            </div>
            {(filterEspece || filterZone) && (
              <button onClick={() => { setFilterEspece(''); setFilterZone('') }}
                className="px-4 py-2.5 text-sm text-theme-secondary hover:text-danger hover:bg-danger/5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <FiX className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
        </Card>
      )}

      {/* ═══ MAP CONTROLS ═══ */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowCaptures(!showCaptures)}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            showCaptures ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-theme-surface text-theme-secondary border border-transparent'
          }`}
        >
          <FiDroplet className="w-3.5 h-3.5" /> Captures
        </button>
        <button onClick={() => setShowZones(!showZones)}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            showZones ? 'bg-success/10 text-success border border-success/20' : 'bg-theme-surface text-theme-secondary border border-transparent'
          }`}
        >
          <FiAnchor className="w-3.5 h-3.5" /> Zones
        </button>
        <button onClick={() => setShowWeather(!showWeather)}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            showWeather ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' : 'bg-theme-surface text-theme-secondary border border-transparent'
          }`}
        >
          <FiWind className="w-3.5 h-3.5" /> Météo
        </button>
        <button onClick={() => setShowAMP(!showAMP)}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            showAMP ? 'bg-emerald-600/10 text-emerald-600 border border-emerald-600/20' : 'bg-theme-surface text-theme-secondary border border-transparent'
          }`}
        >
          <FiShield className="w-3.5 h-3.5" /> AMP
        </button>
        <button onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            showHeatmap ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-theme-surface text-theme-secondary border border-transparent'
          }`}
        >
          <FiGrid className="w-3.5 h-3.5" /> Heatmap
        </button>

        {/* Tile layer selector */}
        <div className="relative">
          <button onClick={() => setShowTileMenu(!showTileMenu)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 bg-theme-surface text-theme-secondary border border-transparent hover:bg-theme-card`}
          >
            🗺️ {TILE_LAYERS[tileLayer]?.name || 'Standard'}
            <FiChevronDown className="w-3 h-3" />
          </button>
          {showTileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTileMenu(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-theme-elevated rounded-xl shadow-xl border border-theme overflow-hidden min-w-[160px]">
                {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                  <button key={key} onClick={() => { setTileLayer(key); setShowTileMenu(false) }}
                    className={`w-full px-4 py-2.5 text-xs text-left hover:bg-theme-card transition-all flex items-center gap-2 ${
                      tileLayer === key ? 'text-accent font-semibold bg-accent/5' : 'text-theme-secondary'
                    }`}
                  >
                    {key === 'standard' ? '🗺️' : key === 'satellite' ? '🛰️' : '⛰️'} {layer.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />
        <button onClick={() => setFullscreen(!fullscreen)}
          className="px-3.5 py-2 rounded-xl text-xs font-medium bg-theme-surface text-theme-secondary hover:bg-theme-card transition-all flex items-center gap-1.5"
        >
          {fullscreen ? <FiMinimize2 className="w-3.5 h-3.5" /> : <FiMaximize2 className="w-3.5 h-3.5" />}
          {fullscreen ? 'Réduire' : 'Plein écran'}
        </button>
      </div>

      {/* ═══ LEGEND ═══ */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-theme-secondary px-1">
        <span className="font-medium flex items-center gap-1"><FiGrid className="w-3 h-3" /> Légende :</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-accent border-2 border-white shadow-sm" /> Capture
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white">🎣</span> Zone Madagascar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-danger/40 border border-danger/60" /> Heatmap (densité)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-cyan-500">➡</span> Vent (direction/force)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500" style={{ width: 12, height: 12 }} /> AMP
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1">
          <span className="text-[10px]">{currentSeason.icone}</span> {currentSeason.nom}
        </span>
      </div>

      {/* ═══ MAIN MAP ═══ */}
      <MapView
        captures={filteredCaptures}
        zones={zones}
        showCaptures={showCaptures}
        showZones={showZones}
        showHeatmap={showHeatmap}
        showWeather={showWeather}
        showAMP={showAMP}
        tileLayer={tileLayer}
        onZoneClick={(zoneName) => setSelectedZone(zoneName === selectedZone ? null : zoneName)}
        onCaptureClick={(capture) => setSelectedCapture(capture)}
        flyToZone={selectedZone}
        height={fullscreen ? (typeof window !== 'undefined' ? window.innerHeight - 200 : 520) : 560}
      />

      {/* ═══ CAPTURE DETAIL ═══ */}
      {selectedCapture && (
        <CaptureDetail capture={selectedCapture} onClose={() => setSelectedCapture(null)} />
      )}

      {/* ═══ SELECTED ZONE DETAIL ═══ */}
      {selectedZone && selectedZoneInfo && (
        <Card variant="glass" className="!p-5 animate-fadeIn border-l-4" style={{ borderLeftColor: selectedZoneInfo.color }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md text-white text-xl"
                style={{ backgroundColor: selectedZoneInfo.color }}>
                🎣
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-primary">{selectedZone}</h3>
                <p className="text-sm text-theme-secondary">{selectedZoneInfo.desc}</p>
              </div>
            </div>
            <button onClick={() => setSelectedZone(null)}
              className="p-1.5 text-theme-muted hover:text-danger rounded-lg hover:bg-danger/10">
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/5 rounded-xl">
              <p className="text-xs text-theme-secondary mb-0.5">🌡️ Température mer</p>
              <p className="text-lg font-bold text-theme-primary">
                {(realWeatherData[selectedZone] || getMeteoForZone(selectedZone))?.temperature_mer ?? '—'}°C
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-500/5 rounded-xl">
              <p className="text-xs text-theme-secondary mb-0.5">🌬️ Vent</p>
              <p className="text-lg font-bold text-theme-primary">
                {(realWeatherData[selectedZone] || getMeteoForZone(selectedZone))?.vent_force ?? '—'} km/h
                <span className="text-sm font-normal text-theme-muted ml-1">
                  {(realWeatherData[selectedZone] || getMeteoForZone(selectedZone))?.vent_direction}
                </span>
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/5 rounded-xl">
              <p className="text-xs text-theme-secondary mb-0.5">🌊 Hauteur vagues</p>
              <p className="text-lg font-bold text-theme-primary">
                {(realWeatherData[selectedZone] || getMeteoForZone(selectedZone))?.hauteur_vagues ?? '—'} m
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-500/5 rounded-xl">
              <p className="text-xs text-theme-secondary mb-0.5">📊 Condition</p>
              <p className={`text-lg font-bold ${
                (realWeatherData[selectedZone] || getMeteoForZone(selectedZone))?.condition_peche === 'Idéale' ? 'text-success' :
                (realWeatherData[selectedZone] || getMeteoForZone(selectedZone))?.condition_peche === 'Favorable' ? 'text-warning' :
                'text-danger'
              }`}>
                {(realWeatherData[selectedZone] || getMeteoForZone(selectedZone))?.condition_peche ?? '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-theme-secondary font-medium mb-1">🎯 Espèces principales</p>
              <p className="text-theme-primary">{selectedZoneInfo.especes.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs text-theme-secondary font-medium mb-1">📅 Saison recommandée</p>
              <p className="text-theme-primary">{selectedZoneInfo.saison}</p>
            </div>
            <div>
              <p className="text-xs text-theme-secondary font-medium mb-1">⚓ Ports de débarquement</p>
              <p className="text-theme-primary">{selectedZoneInfo.ports.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs text-theme-secondary font-medium mb-1">📋 Réglementation</p>
              <p className="text-theme-primary">{selectedZoneInfo.reglementation}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ═══ BOTTOM: Species & Zone + Weather Panel ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Species distribution */}
        <Card variant="glass" className="lg:col-span-1">
          <h3 className="font-bold text-theme-primary mb-4 flex items-center gap-2">
            <FiTarget className="w-4 h-4 text-accent" /> Répartition par espèce
          </h3>
          <div className="space-y-2">
            {speciesDist.map(({ espece, poids, quantite }) => {
              const maxPoids = speciesDist[0]?.poids || 1
              const pct = (poids / maxPoids) * 100
              const color = getSpeciesColor(espece)
              return (
                <div key={espece} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-theme-secondary w-24 truncate">{espece}</span>
                  <div className="flex-1 h-3 bg-theme-surface rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[10px] text-theme-secondary w-16 text-right font-mono">{poids.toFixed(0)} kg</span>
                </div>
              )
            })}
            {speciesDist.length === 0 && (
              <p className="text-sm text-theme-muted text-center py-4">Aucune donnée de capture</p>
            )}
          </div>
        </Card>

        {/* Weather / Season Panel */}
        <Card variant="glass" className="lg:col-span-1">
          <button onClick={() => setShowWeatherPanel(!showWeatherPanel)}
            className="flex items-center justify-between w-full mb-3">
            <h3 className="font-bold text-theme-primary flex items-center gap-2">
              <FiCloud className="w-4 h-4 text-cyan-500" /> Conditions météo
            </h3>
            {showWeatherPanel ? <FiChevronUp className="w-4 h-4 text-theme-muted" /> : <FiChevronDown className="w-4 h-4 text-theme-muted" />}
          </button>
          {showWeatherPanel && (
            <div className="space-y-3">
              {/* Season */}
              <div className="p-3 bg-amber-50 dark:bg-amber-500/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{currentSeason.icone}</span>
                  <div>
                    <p className="text-sm font-bold text-theme-primary">{currentSeason.nom}</p>
                    <p className="text-[10px] text-theme-muted">{currentSeason.periode}</p>
                  </div>
                </div>
                <p className="text-xs text-theme-secondary">{currentSeason.conditions}</p>
                <div className="flex gap-3 mt-2 text-[10px] text-theme-muted">
                  <span>🌬️ {currentSeason.vent_moyen}</span>
                  <span>🌡️ {currentSeason.temp_mer_moy}</span>
                </div>
              </div>

              {/* Espèces abondantes cette saison */}
              <div>
                <p className="text-xs font-medium text-theme-secondary mb-1.5">🐟 Espèces abondantes cette saison</p>
                <div className="flex flex-wrap gap-1">
                  {currentSeason.especes_abondantes.map(e => (
                    <span key={e} className="px-2 py-0.5 bg-accent/5 text-accent text-[10px] rounded-full border border-accent/10">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* Zones recommandées */}
              <div>
                <p className="text-xs font-medium text-theme-secondary mb-1.5">📍 Zones recommandées</p>
                <div className="space-y-1">
                  {currentSeason.zones_recommandees.map(z => {
                    const zone = ZONE_COORDS[z]
                    if (!zone) return null
                    return (
                      <button key={z} onClick={() => setSelectedZone(z)}
                        className="w-full flex items-center gap-2 p-2 bg-theme-surface rounded-lg hover:bg-theme-card transition-all text-left"
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                        <span className="text-xs text-theme-secondary flex-1">{z}</span>
                        <FiMapPin className="w-3 h-3 text-theme-muted" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Alertes */}
              {weatherAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-danger mb-1.5 flex items-center gap-1">
                    <FiAlertTriangle className="w-3 h-3" /> Alertes actives
                  </p>
                  <div className="space-y-1">
                    {weatherAlerts.map((a, i) => (
                      <div key={i} className={`p-2 rounded-lg text-[10px] ${
                        a.type === 'danger' ? 'bg-danger/5 text-danger' : 'bg-warning/5 text-warning'
                      }`}>
                        {a.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Zone distribution */}
        <Card variant="glass" className="lg:col-span-1">
          <button onClick={() => setShowSeasonsPanel(!showSeasonsPanel)}
            className="flex items-center justify-between w-full mb-3">
            <h3 className="font-bold text-theme-primary flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-primary" /> Saisons et AMP
            </h3>
            {showSeasonsPanel ? <FiChevronUp className="w-4 h-4 text-theme-muted" /> : <FiChevronDown className="w-4 h-4 text-theme-muted" />}
          </button>
          {showSeasonsPanel && (
            <div className="space-y-3">
              {/* Saisons */}
              <div className="space-y-2">
                {SAISONS_PECHE.map((s, i) => (
                  <div key={i} className={`p-2.5 rounded-xl border ${
                    s.nom === currentSeason.nom
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-theme/20 bg-theme-surface'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.icone}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${s.nom === currentSeason.nom ? 'text-accent' : 'text-theme-primary'}`}>
                            {s.nom}
                          </p>
                          {s.nom === currentSeason.nom && (
                            <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[8px] rounded-full">Active</span>
                          )}
                        </div>
                        <p className="text-[10px] text-theme-muted">{s.periode}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AMP List */}
              <div>
                <p className="text-xs font-medium text-theme-secondary mb-1.5 flex items-center gap-1">
                  <FiShield className="w-3 h-3 text-emerald-600" /> Aires Marines Protégées ({MARINE_PROTECTED_AREAS.length})
                </p>
                <div className="space-y-1">
                  {MARINE_PROTECTED_AREAS.map((amp, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-theme-secondary">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: amp.color }} />
                      <span className="flex-1 truncate">{amp.nom}</span>
                      <span className="text-[9px] text-theme-muted uppercase">{amp.niveau.substring(0, 5)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Couche AMP toggle */}
              <button onClick={() => setShowAMP(!showAMP)}
                className={`w-full py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  showAMP ? 'bg-emerald-600/10 text-emerald-600' : 'bg-theme-surface text-theme-secondary hover:bg-theme-card'
                }`}
              >
                <FiShield className="w-3.5 h-3.5" />
                {showAMP ? 'Masquer les AMP' : 'Afficher les AMP sur la carte'}
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Zone distribution bars */}
      {zoneDist.length > 0 && (
        <Card variant="glass">
          <h3 className="font-bold text-theme-primary mb-4 flex items-center gap-2">
            <FiMapPin className="w-4 h-4 text-blue-500" /> Répartition des captures par zone
          </h3>
          <div className="space-y-2">
            {zoneDist.map(({ zone, poids, count }) => {
              const maxPoids = zoneDist[0]?.poids || 1
              const pct = (poids / maxPoids) * 100
              const coords = ZONE_COORDS[zone]
              const color = coords?.color || '#6B7280'
              return (
                <div key={zone} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm text-theme-secondary w-36 truncate font-medium">{zone}</span>
                  <div className="flex-1 h-4 bg-theme-surface rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs text-theme-secondary w-20 text-right font-mono">{poids.toFixed(0)} kg</span>
                  <span className="text-xs text-theme-muted w-12 text-right">{count} op.</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ═══ INFO FOOTER ═══ */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl shrink-0">
            <FiMapPin className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">Cartographie des zones de pêche de Madagascar</h3>
            <p className="text-sm text-theme-tertiary">
              Cette carte affiche <strong>{Object.keys(ZONE_COORDS).length} zones de pêche réelles</strong> autour de Madagascar,
              incluant le <strong>Canal de Mozambique</strong> (côte ouest), la <strong>Côte Est</strong> (Océan Indien),
              le <strong>Plateau de Toliara</strong>, et les zones hauturières du nord et du sud.
              Les données météo sont basées sur la climatologie réelle de la région (alizés, mousson, températures moyennes).
              Activez les couches <strong>AMP</strong> pour voir les aires marines protégées, et <strong>Météo</strong> pour les
              conditions de vent. Utilisez les filtres pour explorer par espèce ou zone, et cliquez sur les marqueurs pour
              voir les détails complets (température, vent, vagues, espèces, ports, réglementation).
            </p>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-theme-muted">
              <span>📍 {Object.keys(ZONE_COORDS).length} zones de pêche</span>
              <span>🛡️ {MARINE_PROTECTED_AREAS.length} aires protégées</span>
              <span>🌬️ {currentSeason.nom} active</span>
              <span>🌡️ Source: {weatherSource === 'open-meteo' ? 'Open-Meteo Marine API' : 'Simulation climatologique'}</span>
              <span>🗺️ {TILE_LAYERS[tileLayer]?.name}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
