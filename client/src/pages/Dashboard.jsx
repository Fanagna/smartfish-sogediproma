import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { FiDollarSign, FiActivity, FiDroplet, FiAnchor,
  FiPackage, FiTrendingUp, FiCalendar, FiAlertTriangle
} from 'react-icons/fi'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import KpiCard from '../components/dashboard/KpiCard'
import SectionHeader from '../components/dashboard/SectionHeader'
import ActivityTimeline from '../components/dashboard/ActivityTimeline'
import ProgressRing from '../components/dashboard/ProgressRing'
import { formatCurrency } from '../utils/format'
import dashboardService from '../services/dashboardService'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatNumber = (value, decimals = 1) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals }).format(value || 0)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-theme-secondary text-xs font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Poids (kg)' ? `${entry.value.toFixed(1)} kg` :
           entry.name.includes('Ar') ? formatCurrency(entry.value) :
           entry.name.includes('%') ? `${entry.value.toFixed(1)}%` :
           formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}



// ─── Mini chart components ───────────────────────────────────────────────────
function MiniAreaChart({ data, dataKey = 'value', color = '#3B82F6', height = 80 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="label" tick={false} axisLine={false} />
        <YAxis tick={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${dataKey})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: color, fill: '#0B1120' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function MiniBarChart({ data, dataKey = 'value', color = '#00BCD4', height = 80 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="label" tick={false} axisLine={false} />
        <YAxis tick={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={20}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.value >= 0 ? color : '#FF8A80'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Success Glow Banner ─────────────────────────────────────────────────────
function SuccessBanner({ isAhead }) {
  if (!isAhead) return null
  return (
    <div className="relative overflow-hidden rounded-card glass-strong border border-warning/20 mb-6 animate-slide-down">
      <div className="absolute inset-0 bg-gradient-to-r from-warning/5 via-transparent to-transparent" />
      <div className="relative px-6 py-4 flex items-center gap-4">
        <div className="p-2 bg-warning/15 rounded-xl">
          <FiTrendingUp className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-sm font-bold text-theme-primary">Performance exceptionnelle</p>
          <p className="text-xs text-theme-tertiary mt-0.5">
            Vous dépassez vos objectifs ce mois-ci. Continuez sur cette lancée !
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getDashboardStats,
    refetchInterval: 5 * 60 * 1000,
  })

  // ─── Activités récentes (temps réel via API) ─────────────────────────────
  const { data: activitiesData } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: () => dashboardService.getRecentActivities(15),
    refetchInterval: 60000,
  })

  const recentActivities = activitiesData?.activities || []

  // Simulated performance personality layer
  const [isAhead, setIsAhead] = useState(false)

  useEffect(() => {
    if (stats?.totalCaptures30j > 50) {
      setIsAhead(true)
    }
  }, [stats])

  // ─── Prepare chart data ──────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!stats?.capturesParJour) return []
    return stats.capturesParJour.map(d => ({
      ...d,
      dateFormatted: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    }))
  }, [stats])

  const speciesData = useMemo(() => {
    if (!stats?.repartitionEspece) return []
    return stats.repartitionEspece
  }, [stats])

  // ─── Sparkline data (données réelles de l'API) ────────────────────────
  const sparklineRevenue = useMemo(() => stats?.ventesParJour?.slice(-14).map(d => d.totalCA) || [], [stats?.ventesParJour])
  const sparklineUsers = useMemo(() => stats?.capturesParJour?.slice(-14).map(d => d.totalPoids) || [], [stats?.capturesParJour])
  const sparklineConversion = useMemo(() => stats?.exportationsParJour?.slice(-14).map(d => d.totalCA) || [], [stats?.exportationsParJour])

  // ─── Species colors ──────────────────────────────────────────────────────
  const SPECIES_COLORS = ['#3B82F6', '#00BCD4', '#00E676', '#FFD700', '#FF8A80', '#A78BFA', '#F472B6', '#F97316']

  // ─── Objectifs calculés à partir des données réelles ─────────────────────
  const caMensuel = stats?.totalCATotal30j || 0
  const poidsCaptures = stats?.totalPoidsCaptures30j || 0
  const caExport = stats?.totalCAExportations30j || 0
  // Objectifs estimés: moyenne des 3 derniers mois (basée sur 30j * 3)
  const caTarget = Math.max(caMensuel * 1.2, 100000)
  const captureTarget = Math.max(poidsCaptures * 1.2, 5000)
  const exportTarget = Math.max(caExport * 1.2, 50000)
  const objectives = [
    { label: 'CA Mensuel', value: Math.min(100, Math.round((caMensuel / caTarget) * 100)), color: '#3B82F6', current: `${(caMensuel / 1000).toFixed(1)}k Ar`, target: `${(caTarget / 1000).toFixed(0)}k Ar` },
    { label: 'Captures', value: Math.min(100, Math.round((poidsCaptures / captureTarget) * 100)), color: '#00BCD4', current: `${poidsCaptures.toFixed(0)} kg`, target: `${captureTarget.toFixed(0)} kg` },
    { label: 'Exportations', value: Math.min(100, Math.round((caExport / exportTarget) * 100)), color: '#A78BFA', current: `${(caExport / 1000).toFixed(1)}k Ar`, target: `${(exportTarget / 1000).toFixed(0)}k Ar` },
  ]

  // ─── Top species ──────────────────────────────────────────────────────────
  const topSpecies = useMemo(() => {
    if (!speciesData.length) return []
    return [...speciesData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, i) => ({ ...item, rank: i + 1, color: SPECIES_COLORS[i % SPECIES_COLORS.length] }))
  }, [speciesData])

  // ─── Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-5">
          <Spinner size="xl" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Chargement du dashboard</p>
            <p className="text-sm text-theme-tertiary mt-1">Récupération des données en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Error State ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📡</div>
          <p className="text-xl font-bold text-danger mb-2">Erreur de connexion</p>
          <p className="text-theme-tertiary text-sm mb-6">
            {error?.message || 'Impossible de charger les données du dashboard.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-pill hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 text-sm font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // ─── Main Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12 page-enter">
      {/* Success Banner */}
      <SuccessBanner isAhead={isAhead} />

      {/* ────── SECTION B: KPI Row ────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        style={{ animation: 'none' }}
      >
        {/* KPI 1: Revenu */}
        <div className="animate-slide-up animate-stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard
            title="Revenu total (30j)"
            value={stats?.totalCATotal30j || 0}
            unit="Ar"
            icon={FiDollarSign}
            color="primary"
            sparklineData={sparklineRevenue}
            isTargetAhead={isAhead}
          />
        </div>

        {/* KPI 2: Captures */}
        <div className="animate-slide-up animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard
            title="Captures (30j)"
            value={stats?.totalPoidsCaptures30j || 0}
            unit="kg"
            icon={FiDroplet}
            color="accent"
            sparklineData={sparklineUsers}
          />
        </div>

        {/* KPI 3: Bateaux actifs */}
        <div className="animate-slide-up animate-stagger-3 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard
            title="Bateaux actifs"
            value={stats?.totalBateaux || 0}
            unit="navires"
            icon={FiAnchor}
            color="success"
            sparklineData={sparklineConversion}
          />
        </div>
      </div>

      {/* ────── SECTION C (60%) + D (40%) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── C: Zone Principale (60%) ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Chart */}
          <Card variant="glass" className="animate-slide-up animate-stagger-4 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <SectionHeader
              icon={FiActivity}
              title="Captures par jour"
              subtitle="Évolution sur 30 jours"
              color="accent"
            />
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="captureGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00BCD4" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="poidsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="dateFormatted"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="stepBefore"
                    dataKey="totalPoids"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fill="url(#poidsGradient)"
                    name="Poids (kg)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#3B82F6', fill: '#0B1120' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalQuantite"
                    stroke="#00BCD4"
                    strokeWidth={2}
                    fill="url(#captureGradient)"
                    name="Quantité"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#00BCD4', fill: '#0B1120' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Two mini charts side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card variant="glass" className="animate-slide-up animate-stagger-5 opacity-0" style={{ animationFillMode: 'forwards' }}>
              <SectionHeader
                icon={FiPackage}
                title="Stock par espèce"
                color="warning"
              />
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speciesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {speciesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SPECIES_COLORS[index % SPECIES_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-2">
                {speciesData.slice(0, 5).map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-theme-tertiary">
                    <span className="w-2 h-2 rounded-full" style={{ background: SPECIES_COLORS[i % SPECIES_COLORS.length] }} />
                    {item.espece}
                  </span>
                ))}
              </div>
            </Card>

            <Card variant="glass" className="animate-slide-up animate-stagger-6 opacity-0" style={{ animationFillMode: 'forwards' }}>
              <SectionHeader
                icon={FiAlertTriangle}
                title="Anomalies"
                color="danger"
                count={stats?.anomaliesEnAttente || 0}
              />
              <div className="flex flex-col items-center justify-center h-[180px]">
                {stats?.anomaliesEnAttente > 0 ? (
                  <>
                    <span className="text-5xl font-extrabold text-danger tabular-nums">
                      {stats.anomaliesEnAttente}
                    </span>
                    <p className="text-sm text-theme-tertiary mt-2">Anomalies en attente</p>
                    <div className="flex gap-1.5 mt-3">
                      {[...Array(Math.min(stats.anomaliesEnAttente, 5))].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-danger animate-pulse-soft"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                      <FiActivity className="w-7 h-7 text-success" />
                    </div>
                    <p className="text-theme-tertiary text-sm">Aucune anomalie</p>
                    <p className="text-theme-muted text-xs mt-0.5">Tout est sous contrôle</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* ── D: Zone Secondaire (40%) ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Timeline — données temps réel */}
          <Card variant="glass" className="animate-slide-up animate-stagger-5 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <ActivityTimeline activities={recentActivities} maxItems={6} title="Activité récente" />
          </Card>

          {/* Top 5 Species */}
          <Card variant="glass" className="animate-slide-up animate-stagger-6 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <SectionHeader icon={FiTrendingUp} title="Top espèces" color="warning" />
            {topSpecies.length > 0 ? (
              <div className="space-y-3">
                {topSpecies.map((species) => (
                  <div key={species.rank} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all duration-300">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                      ${species.rank === 1 ? 'bg-warning/15 text-warning' :
                        species.rank === 2 ? 'bg-white/10 text-theme-secondary' :
                        species.rank === 3 ? 'bg-warning/10 text-warning' :
                        'bg-white/5 text-theme-tertiary'}
                    `}>
                      #{species.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-primary truncate">{species.espece}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(species.value / Math.max(...topSpecies.map(s => s.value))) * 100}%`,
                              backgroundColor: species.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-theme-primary tabular-nums">
                      {formatNumber(species.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-theme-tertiary">
                <FiTrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune donnée d'espèce</p>
              </div>
            )}
          </Card>

          {/* Objectives Widget */}
          <Card variant="glass" className="animate-slide-up animate-stagger-7 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <SectionHeader icon={FiCalendar} title="Objectifs du mois" color="primary" />
            <div className="flex justify-around items-center py-2">
              {objectives.map((obj, i) => (
                <div key={i} className="flex flex-col items-center">
                  <ProgressRing
                    value={obj.value}
                    size={90}
                    strokeWidth={6}
                    color={obj.color}
                    label={obj.label}
                  />
                  <div className="text-center mt-2">
                    <p className="text-[10px] text-theme-tertiary">{obj.current}</p>
                    <p className="text-[10px] text-theme-muted">/ {obj.target}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ────── Stock & Alert Summary Row ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card variant="subtle" className="animate-slide-up animate-stagger-6 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <FiPackage className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-theme-tertiary font-medium">Stock actuel</p>
              <p className="text-xl font-bold text-theme-primary tabular-nums mt-0.5">
                {formatNumber(stats?.stockTotal)} kg
              </p>
            </div>
          </div>
        </Card>

        <Card variant="subtle" className="animate-slide-up animate-stagger-7 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl">
              <FiTrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-theme-tertiary font-medium">CA Exportations (30j)</p>
              <p className="text-xl font-bold text-theme-primary tabular-nums mt-0.5">
                {formatCurrency(stats?.totalCAExportations30j)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="subtle" className="animate-slide-up animate-stagger-8 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl">
              <FiDroplet className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-theme-tertiary font-medium">CA Ventes locales (30j)</p>
              <p className="text-xl font-bold text-theme-primary tabular-nums mt-0.5">
                {formatCurrency(stats?.totalCAVentes30j)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
