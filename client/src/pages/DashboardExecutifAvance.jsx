import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import SectionHeader from '../components/dashboard/SectionHeader'
import dashboardService from '../services/dashboardService'
import { formatCurrency } from '../utils/format'
import ExportButton from '../components/ui/ExportButton'
import { exportToPDF } from '../utils/exportUtils'
import {
  FiDollarSign, FiTrendingUp, FiPackage,
  FiBarChart2, FiActivity, FiCalendar, FiAnchor,
  FiAlertTriangle, FiDroplet, FiMapPin,
  FiArrowUp, FiArrowDown, FiZap, FiShield,
  FiRefreshCw, FiNavigation, FiStar,
  FiInfo, FiCheckCircle, FiPieChart
} from 'react-icons/fi'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ComposedChart, Legend
} from 'recharts'

const CHART_COLORS = ['#3B82F6', '#00BCD4', '#00E676', '#FFD700', '#FF8A80', '#A78BFA', '#F472B6', '#F97316', '#14B8A6', '#EC4899']
const URGENCE_COLORS = { CRITIQUE: 'bg-danger/20 text-danger border-danger/30', HAUTE: 'bg-warning/20 text-warning border-warning/20', MOYENNE: 'bg-accent/15 text-accent border-accent/20', BASSE: 'bg-success/15 text-success border-success/20' }
const URGENCE_DOTS = { CRITIQUE: 'bg-danger', HAUTE: 'bg-warning', MOYENNE: 'bg-accent', BASSE: 'bg-success' }

const formatNumber = (v, d = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const formatHour = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-theme-secondary text-xs font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' && entry.name.includes('Ar') || entry.name.includes('€') ? formatCurrency(entry.value) :
           typeof entry.value === 'number' ? formatNumber(entry.value, 1) : entry.value}
        </p>
      ))}
    </div>
  )
}

// ─── Mini Sparkline ───
function MiniSparkline({ data, color = '#3B82F6', height = 40 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── KPI Big Number ───
function KpiBig({ label, value, unit, icon: Icon, color, trend, delta, sparklineData }) {
  const trendUp = trend === 'up' || delta > 0
  const trendColor = trendUp ? 'var(--color-success)' : 'var(--color-danger)'
  return (
    <Card variant="glass" className="!p-5 group hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110`} style={{ backgroundColor: `color-mix(in srgb, var(--color-${color}) 15%, transparent)` }}>
          <Icon className="w-5 h-5" style={{ color: `var(--color-${color})` }} />
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 opacity-60 group-hover:opacity-100 transition-opacity">
            <MiniSparkline data={sparklineData.map(v => ({ v }))} color={`var(--color-${color})`} height={36} />
          </div>
        )}
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
        {unit && <span className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-xs font-bold" style={{ color: trendColor }}>
            {trendUp ? <FiArrowUp className="w-3 h-3 inline mr-0.5" /> : <FiArrowDown className="w-3 h-3 inline mr-0.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vs période préc.</span>
        </div>
      )}
    </Card>
  )
}

// ─── Fleet Status Badge ───
function FleetStatBadge({ label, count, color, icon: Icon }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 duration-200"
      style={{ backgroundColor: `color-mix(in srgb, var(--color-${color}) 10%, transparent)`, border: `1px solid color-mix(in srgb, var(--color-${color}) 20%, transparent)` }}>
      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, var(--color-${color}) 20%, transparent)` }}>
        <Icon className="w-4 h-4" style={{ color: `var(--color-${color})` }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: `var(--color-${color})` }}>{count}</p>
        <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      </div>
    </div>
  )
}

// ─── Performance Bar ───
function PerfBar({ value, color = '#3B82F6', size = 'sm' }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5'
  return (
    <div className={`w-full ${size === 'sm' ? 'bg-white/5' : 'bg-theme-surface'} rounded-full overflow-hidden`}>
      <div className={`${h} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

// ─── Main Component ───
export default function DashboardExecutifAvance() {
  const [activeTab, setActiveTab] = useState('apercu')
  const [showAllAlerts, setShowAllAlerts] = useState(false)

  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['executifAvance'],
    queryFn: dashboardService.getExecutifAvance,
    refetchInterval: 60 * 1000,
  })

  // Données réelles pour les sparklines (via caParJour et capturesParJour de l'API)
  const sparkRevenue = useMemo(() => stats?.tendances?.caParJour?.slice(-14).map(d => d.ca) || [], [stats?.tendances?.caParJour])
  const sparkCapture = useMemo(() => stats?.tendances?.capturesParJour?.slice(-14).map(d => d.poids) || [], [stats?.tendances?.capturesParJour])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Spinner size="xl" className="border-primary/30 border-t-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FiBarChart2 className="w-6 h-6 text-primary animate-pulse-soft" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard Exécutif Avancé</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Consolidation des données en temps réel...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <FiInfo className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
          <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-danger)' }}>Erreur de chargement</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>{error?.message || 'Impossible de charger les données consolidées'}</p>
          <button onClick={() => refetch()} className="px-6 py-3 rounded-pill text-white font-medium transition-all shadow-lg flex items-center gap-2 mx-auto"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <FiRefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  const kpis = stats?.kpis || {}
  const bateaux = stats?.rentabiliteBateaux || []
  const zones = stats?.performanceZones || []
  const alertes = stats?.alertesCritiques || []
  const tendances = stats?.tendances || {}
  const topEspeces = stats?.topEspeces || []
  const cashflow = stats?.cashflow || { entrees: 0, sorties: 0, solde: 0, ratio: 0 }
  const flotteStats = stats?.flotteStats || {}
  const caParJour = tendances.caParJour || []
  const capturesParJour = tendances.capturesParJour || []
  const evolutionMensuelle = tendances.evolutionMensuelle || []

  const topBateaux = bateaux.slice(0, 5)
  const topZones = zones.slice(0, 6)
  const alertesDisplay = showAllAlerts ? alertes : alertes.slice(0, 8)
  const nbAlertesNonCritiques = alertes.length - alertes.filter(a => a.urgence === 'CRITIQUE' || a.urgence === 'HAUTE').length

  return (
    <div className="space-y-6 pb-12 page-enter">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
              <FiZap className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Exécutif Avancé</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}>
              Temps réel
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Vue consolidée — Rentabilité, performances flotte, alertes critiques, tendances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            onExportPDF={async () => {
              const columns = [
                { key: 'nom', label: 'Bateau' },
                { key: 'totalPoids', label: 'Poids (kg)', render: (r) => r.totalPoids?.toFixed(1) || '0' },
                { key: 'ca', label: 'CA', render: (r) => (r.ca || 0).toFixed(0) + ' Ar' },
                { key: 'coutMaintenance', label: 'Coût maint.', render: (r) => (r.coutMaintenance || 0).toFixed(0) + ' Ar' },
                { key: 'margeEstimee', label: 'Marge', render: (r) => (r.margeEstimee || 0).toFixed(0) + ' Ar' },
                { key: 'ratioCaptureCarburant', label: 'Ratio kg/L' },
                { key: 'performance', label: 'Score /100' },
              ]
              await exportToPDF(bateaux, columns, 'Rapport Exécutif — Rentabilité Flotte', 'executif-flotte')
            }}
            onExportExcel={async () => {
              const { exportToExcel } = await import('../utils/exportUtils')
              const columns = [
                { key: 'nom', label: 'Bateau' },
                { key: 'totalPoids', label: 'Poids (kg)', render: (r) => r.totalPoids?.toFixed(1) || '0' },
                { key: 'ca', label: 'CA', render: (r) => (r.ca || 0).toFixed(0) + ' Ar' },
                { key: 'coutMaintenance', label: 'Coût maint.', render: (r) => (r.coutMaintenance || 0).toFixed(0) + ' Ar' },
                { key: 'margeEstimee', label: 'Marge', render: (r) => (r.margeEstimee || 0).toFixed(0) + ' Ar' },
                { key: 'ratioCaptureCarburant', label: 'Ratio kg/L' },
                { key: 'performance', label: 'Score /100' },
              ]
              await exportToExcel(bateaux, columns, 'executif-flotte', 'Rentabilité')
            }}
            size="sm"
          />
          <button onClick={() => refetch()} className="p-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <FiRefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* ─── CASHFLOW BANNER ─── */}
      <Card variant="glass" className="!p-0 overflow-hidden">
        <div className="relative px-6 py-5">
          <div className="absolute inset-0 opacity-5" style={{
            background: `linear-gradient(135deg, ${cashflow.solde >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}, transparent 60%)`
          }} />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${cashflow.solde >= 0 ? 'bg-success/15' : 'bg-danger/15'}`}>
                <FiDollarSign className={`w-7 h-7 ${cashflow.solde >= 0 ? 'text-success' : 'text-danger'}`} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>CASHFLOW — 30 derniers jours</p>
                <p className="text-3xl font-extrabold mt-1" style={{
                  color: cashflow.solde >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
                  {formatCurrency(cashflow.solde)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Entrées: {formatCurrency(cashflow.entrees)} • Sorties: {formatCurrency(cashflow.sorties)} • Marge: {cashflow.ratio}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>CA Total</p>
                <p className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(kpis.caTotal30j)}</p>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: 'var(--border-default)' }} />
              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Coûts</p>
                <p className="text-xl font-extrabold" style={{ color: 'var(--color-danger)' }}>{formatCurrency(kpis.coutOperationnel30j)}</p>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: 'var(--border-default)' }} />
              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Marge</p>
                <p className="text-xl font-extrabold" style={{
                  color: cashflow.ratio >= 30 ? 'var(--color-success)' : cashflow.ratio >= 15 ? 'var(--color-warning)' : 'var(--color-danger)'
                }}>{cashflow.ratio}%</p>
              </div>
            </div>
          </div>
          {/* Mini bar chart */}
          <div className="relative mt-4 h-8 flex items-end gap-0.5">
            {caParJour.slice(-14).map((d, i) => {
              const maxCa = Math.max(...caParJour.slice(-14).map(x => x.ca), 1)
              const h = Math.max(4, (d.ca / maxCa) * 32)
              return (
                <div key={i} className="flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80"
                  style={{ height: `${h}px`, backgroundColor: cashflow.solde >= 0 ? 'var(--color-success)' : 'var(--color-danger)', opacity: 0.4 + (d.ca / maxCa) * 0.4 }}
                  title={`${d.date || ''}: ${formatCurrency(d.ca)}`} />
              )
            })}
          </div>
        </div>
      </Card>

      {/* ─── TABS DE NAVIGATION ─── */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl flex-wrap" style={{ backgroundColor: 'var(--bg-surface)' }}>
        {[
          { key: 'apercu', icon: FiZap, label: 'Aperçu global' },
          { key: 'flotte', icon: FiAnchor, label: 'Rentabilité flotte' },
          { key: 'zones', icon: FiMapPin, label: 'Performance zones' },
          { key: 'alertes', icon: FiAlertTriangle, label: `Alertes (${alertes.length})` },
          { key: 'tendances', icon: FiTrendingUp, label: 'Tendances' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key ? 'shadow-md' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: activeTab === tab.key ? `color-mix(in srgb, var(--color-primary) 15%, transparent)` : 'transparent',
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--text-tertiary)'
            }}>
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── TAB: APERÇU GLOBAL ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'apercu' && (
        <>
          {/* ─── KPIs ROW ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiBig label="CA Total (30j)" value={kpis.caTotal30j} unit="Ar" icon={FiDollarSign} color="primary" sparklineData={sparkRevenue} />
            <KpiBig label="Captures (30j)" value={kpis.totalPoids30j} unit="kg" icon={FiDroplet} color="accent" sparklineData={sparkCapture} />
            <KpiBig label="Stock actuel" value={kpis.stockTotal} unit="kg" icon={FiPackage} color="success" />
            <KpiBig label="Anomalies" value={kpis.anomaliesActives} icon={FiAlertTriangle} color={kpis.anomaliesActives > 0 ? 'danger' : 'success'} />
            <KpiBig label="Marge brute" value={kpis.margeBruteRatio} unit="%" icon={FiTrendingUp} color={kpis.margeBruteRatio >= 30 ? 'success' : kpis.margeBruteRatio >= 15 ? 'warning' : 'danger'} />
          </div>

          {/* ─── STATUT FLOTTE ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FleetStatBadge label="Total navires" count={flotteStats.total} color="primary" icon={FiAnchor} />
            <FleetStatBadge label="Actifs" count={flotteStats.actifs} color="success" icon={FiNavigation} />
            <FleetStatBadge label="En alerte" count={flotteStats.enAlerte} color="warning" icon={FiAlertTriangle} />
            <FleetStatBadge label="Inactifs" count={flotteStats.inactifs} color="danger" icon={FiActivity} />
          </div>

          {/* ─── TOP BATEAUX + TOP ZONES ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Bateaux par performance */}
            <Card variant="glass">
              <SectionHeader icon={FiStar} title="Top Bateaux" subtitle="Classement par performance" color="warning" />
              <div className="space-y-3">
                {topBateaux.map((b, i) => (
                  <div key={b.id} className="group flex items-center gap-3 p-2.5 rounded-xl transition-all hover:-translate-x-0.5"
                    style={{ backgroundColor: i === 0 ? 'color-mix(in srgb, var(--color-warning) 8%, transparent)' : 'transparent' }}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                      i === 0 ? 'bg-warning' : i === 1 ? 'bg-white/20' : i === 2 ? 'bg-warning/60' : 'bg-white/10'
                    }`} style={{ color: i > 2 ? 'var(--text-tertiary)' : 'white' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{b.nom}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: b.performance >= 70 ? 'var(--color-success)' : b.performance >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                          {b.performance}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{formatNumber(b.totalPoids)} kg</span>
                        <span>•</span>
                        <span>{formatCurrency(b.ca)} CA</span>
                        <span>•</span>
                        <span>Ratio: {b.ratioCaptureCarburant} kg/L</span>
                      </div>
                      <PerfBar value={b.performance} color={b.performance >= 70 ? 'var(--color-success)' : b.performance >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'} />
                    </div>
                  </div>
                ))}
                {topBateaux.length === 0 && (
                  <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                    <FiAnchor className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune donnée bateau</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Top Zones */}
            <Card variant="glass">
              <SectionHeader icon={FiMapPin} title="Top Zones" subtitle="Classement par performance" color="accent" />
              <div className="space-y-3">
                {topZones.map((z, i) => (
                  <div key={z.zone} className="group flex items-center gap-3 p-2.5 rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `color-mix(in srgb, ${CHART_COLORS[i % CHART_COLORS.length]} 20%, transparent)`, color: CHART_COLORS[i % CHART_COLORS.length] }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{z.zone}</span>
                        <span className="text-xs font-bold" style={{ color: z.performance >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          {z.performance}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{formatNumber(z.totalPoids)} kg</span>
                        <span>•</span>
                        <span>{z.nbEspeces} esp.</span>
                        <span>•</span>
                        <span>{formatCurrency(z.ca)} CA</span>
                      </div>
                      <PerfBar value={z.performance} color={CHART_COLORS[i % CHART_COLORS.length]} />
                    </div>
                  </div>
                ))}
                {topZones.length === 0 && (
                  <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                    <FiMapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune donnée de zone</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ─── ALERTES RÉCENTES (mini) ─── */}
          {alertes.length > 0 && (
            <Card variant="glass">
              <SectionHeader icon={FiAlertTriangle} title={`Alertes critiques (${alertes.filter(a => a.urgence === 'CRITIQUE' || a.urgence === 'HAUTE').length})`} subtitle="À traiter en priorité" color="danger" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alertes.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{
                      backgroundColor: a.urgence === 'CRITIQUE' ? 'var(--bg-card)' : 'transparent',
                      border: `1px solid ${a.urgence === 'CRITIQUE' ? 'var(--color-danger)' : 'var(--border-default)'}`
                    }}>
                    <div className={`p-1.5 rounded-lg shrink-0 ${a.urgence === 'CRITIQUE' ? 'bg-danger/20' : a.urgence === 'HAUTE' ? 'bg-warning/20' : 'bg-accent/20'}`}>
                      {a.type === 'CARBURANT' ? <FiDroplet className="w-4 h-4 text-danger" /> :
                       a.type === 'STOCK' ? <FiPackage className="w-4 h-4 text-warning" /> :
                       a.type === 'INACTIVITE' ? <FiActivity className="w-4 h-4 text-warning" /> :
                       <FiAlertTriangle className="w-4 h-4 text-danger" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{
                          backgroundColor: `color-mix(in srgb, var(--color-${a.urgence === 'CRITIQUE' ? 'danger' : a.urgence === 'HAUTE' ? 'warning' : 'accent'}) 20%, transparent)`,
                          color: `var(--color-${a.urgence === 'CRITIQUE' ? 'danger' : a.urgence === 'HAUTE' ? 'warning' : 'accent'})`
                        }}>{a.urgence}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{formatHour(a.date)}</span>
                      </div>
                      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{a.description}</p>
                      {a.entite && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{a.entite}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {alertes.length > 4 && (
                <button onClick={() => setActiveTab('alertes')} className="w-full mt-3 py-2 text-xs font-medium rounded-xl transition-all"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-tertiary)' }}>
                  Voir toutes les alertes ({alertes.length})
                </button>
              )}
            </Card>
          )}

          {/* ─── ESPÈCES TOP ─── */}
          {topEspeces.length > 0 && (
            <Card variant="glass">
              <SectionHeader icon={FiPieChart} title="Top Espèces par CA" subtitle="30 derniers jours" color="primary" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {topEspeces.slice(0, 5).map((e, i) => {
                  const maxCA = topEspeces[0]?.ca || 1
                  const pct = (e.ca / maxCA) * 100
                  return (
                    <div key={e.espece} className="p-3 rounded-xl text-center transition-all hover:-translate-y-0.5"
                      style={{ backgroundColor: 'var(--bg-card)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold text-white"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}>
                        {e.espece.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{e.espece}</p>
                      <p className="text-lg font-extrabold mt-0.5" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                        {formatCurrency(e.ca)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatNumber(e.quantite)} kg</p>
                      <PerfBar value={pct} color={CHART_COLORS[i % CHART_COLORS.length]} />
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── TAB: RENTABILITÉ FLOTTE ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'flotte' && (
        <>
          <div className="grid grid-cols-1 gap-4">
            <Card variant="glass">
              <SectionHeader icon={FiAnchor} title="Rentabilité par Bateau" subtitle="Analyse détaillée — CA, coûts, ratio capture/carburant" color="primary" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Bateau</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Captures</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Poids (kg)</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>CA</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Coût Maint.</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Marge</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Ratio kg/L</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Perf.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {bateaux.map((b, i) => (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}>{i + 1}</div>
                            <div>
                              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{b.nom}</p>
                              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{b.immatriculation} • {b.capitaine}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>{b.totalCaptures}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatNumber(b.totalPoids, 1)}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-success)' }}>{formatCurrency(b.ca)}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--color-danger)' }}>{formatCurrency(b.coutMaintenance)}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{
                          color: b.margeEstimee >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>{formatCurrency(b.margeEstimee)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                            backgroundColor: b.ratioCaptureCarburant >= 1 ? 'color-mix(in srgb, var(--color-success) 20%, transparent)' : 'color-mix(in srgb, var(--color-warning) 20%, transparent)',
                            color: b.ratioCaptureCarburant >= 1 ? 'var(--color-success)' : 'var(--color-warning)'
                          }}>{b.ratioCaptureCarburant}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <PerfBar value={b.performance} color={b.performance >= 70 ? 'var(--color-success)' : b.performance >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'} />
                            <span className="text-xs font-bold w-8 text-right" style={{ color: 'var(--text-tertiary)' }}>{b.performance}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bateaux.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                  <FiAnchor className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Aucune donnée de flotte disponible</p>
                </div>
              )}
            </Card>

            {/* Bar Chart — CA par bateau */}
            {bateaux.length > 0 && (
              <Card variant="glass">
                <SectionHeader icon={FiBarChart2} title="Comparatif CA par Bateau" subtitle="30 derniers jours" color="accent" />
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bateaux.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="nom" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ca" name="CA (Ar)" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {bateaux.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── TAB: PERFORMANCE ZONES ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'zones' && (
        <>
          <div className="grid grid-cols-1 gap-4">
            <Card variant="glass">
              <SectionHeader icon={FiMapPin} title="Performance par Zone de Pêche" subtitle="Analyse complète — poids, CA, espèces, score" color="accent" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Zone</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Captures</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Poids (kg)</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Poids moyen</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Espèces</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>CA</th>
                      <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {zones.map((z, i) => (
                      <tr key={z.zone} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{z.zone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{z.nbCaptures}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-primary)' }}>{formatNumber(z.totalPoids, 1)}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatNumber(z.poidsMoyen, 1)}</td>
                        <td className="px-4 py-3 text-right">{z.nbEspeces}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-success)' }}>{formatCurrency(z.ca)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <PerfBar value={z.performance} color={CHART_COLORS[i % CHART_COLORS.length]} />
                            <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>{z.performance}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {zones.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                  <FiMapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Aucune donnée de zone</p>
                </div>
              )}
            </Card>

            {/* Bar Chart — Performance zones */}
            {zones.length > 0 && (
              <Card variant="glass">
                <SectionHeader icon={FiBarChart2} title="Comparatif des Zones" subtitle="Poids capturé (kg)" color="accent" />
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zones.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="zone" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={130} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="totalPoids" name="Poids (kg)" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {zones.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── TAB: ALERTES CRITIQUES ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'alertes' && (
        <Card variant="glass">
          <SectionHeader icon={FiShield} title="Alertes Critiques Consolidées"
            subtitle={`${alertes.length} alerte(s) — ${alertes.filter(a => a.urgence === 'CRITIQUE').length} critique(s)`}
            color="danger" count={alertes.length} />
          <div className="space-y-3">
            {alertesDisplay.map((a, i) => (
              <div key={i} className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:-translate-x-0.5"
                style={{
                  backgroundColor: a.urgence === 'CRITIQUE' ? 'color-mix(in srgb, var(--color-danger) 8%, transparent)' :
                    a.urgence === 'HAUTE' ? 'color-mix(in srgb, var(--color-warning) 6%, transparent)' : 'transparent',
                  border: `1px solid ${a.urgence === 'CRITIQUE' ? 'var(--color-danger)' :
                    a.urgence === 'HAUTE' ? 'var(--color-warning)' : 'var(--border-default)'}`
                }}>
                <div className={`p-2 rounded-xl shrink-0 ${
                  a.urgence === 'CRITIQUE' ? 'bg-danger/20' :
                  a.urgence === 'HAUTE' ? 'bg-warning/20' : 'bg-accent/15'
                }`}>
                  {a.type === 'CARBURANT' ? <FiDroplet className="w-5 h-5" style={{ color: a.urgence === 'CRITIQUE' ? 'var(--color-danger)' : 'var(--color-warning)' }} /> :
                   a.type === 'STOCK' ? <FiPackage className="w-5 h-5" style={{ color: 'var(--color-warning)' }} /> :
                   a.type === 'ANOMALIE' ? <FiAlertTriangle className="w-5 h-5" style={{ color: 'var(--color-danger)' }} /> :
                   a.type === 'INACTIVITE' ? <FiActivity className="w-5 h-5" style={{ color: 'var(--color-warning)' }} /> :
                   <FiShield className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${URGENCE_COLORS[a.urgence] || URGENCE_COLORS.BASSE}`}>
                      {a.urgence}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                      color: 'var(--color-primary)'
                    }}>{a.type}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{formatHour(a.date)}</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.description}</p>
                  {a.entite && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <FiNavigation className="w-3 h-3" /> {a.entite}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {alertes.length === 0 && (
              <div className="text-center py-12">
                <FiCheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-success)' }} />
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Aucune alerte critique</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Tous les indicateurs sont dans les normes</p>
              </div>
            )}
            {alertes.length > 8 && (
              <button onClick={() => setShowAllAlerts(!showAllAlerts)}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-tertiary)',
                }}>
                {showAllAlerts ? `Réduire (afficher les 8 plus récentes)` : `Afficher toutes les alertes (${alertes.length})`}
              </button>
            )}
          </div>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── TAB: TENDANCES ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'tendances' && (
        <div className="space-y-6">
          {/* CA par jour */}
          <Card variant="glass">
            <SectionHeader icon={FiTrendingUp} title="CA par Jour" subtitle="Évolution sur 30 jours — Ventes + Export" color="primary" />
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={caParJour.map(d => ({ ...d, dateF: d.date?.slice(5) || '' }))}>
                  <defs>
                    <linearGradient id="caAvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="dateF" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="ca" stroke="#3B82F6" strokeWidth={2.5} fill="url(#caAvGrad)" name="CA (Ar)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: '#0B1120' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Captures par jour + Evolution mensuelle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass">
              <SectionHeader icon={FiDroplet} title="Captures par Jour" subtitle="Poids (kg) — 30 jours" color="accent" />
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={capturesParJour.map(d => ({ ...d, dateF: d.date?.slice(5) || '' }))}>
                    <defs>
                      <linearGradient id="captAvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00BCD4" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="dateF" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="poids" stroke="#00BCD4" strokeWidth={2.5} fill="url(#captAvGrad)" name="Poids (kg)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: '#0B1120' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card variant="glass">
              <SectionHeader icon={FiCalendar} title="Évolution Mensuelle" subtitle="90 derniers jours" color="success" />
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolutionMensuelle}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left" dataKey="ca" name="CA (Ar)" fill="#00E676" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Line yAxisId="right" type="monotone" dataKey="poids" name="Poids (kg)" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Distribution espèces (Pie) */}
          {topEspeces.length > 0 && (
            <Card variant="glass">
              <SectionHeader icon={FiPieChart} title="Répartition du CA par Espèce" subtitle="30 derniers jours" color="warning" />
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="h-[300px] w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topEspeces.slice(0, 6)} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                        paddingAngle={3} dataKey="ca" label={({ espece, percent }) => `${espece} ${(percent * 100).toFixed(0)}%`}>
                        {topEspeces.slice(0, 6).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-2">
                  {topEspeces.slice(0, 6).map((e, i) => {
                    const maxCA = topEspeces[0]?.ca || 1
                    return (
                      <div key={e.espece} className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-sm w-24 truncate font-medium" style={{ color: 'var(--text-secondary)' }}>{e.espece}</span>
                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(e.ca / maxCA) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        </div>
                        <span className="text-xs font-bold w-24 text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(e.ca)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
