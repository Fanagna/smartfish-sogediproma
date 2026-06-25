import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import KpiCard from '../components/dashboard/KpiCard'
import SectionHeader from '../components/dashboard/SectionHeader'
import { formatCurrency } from '../utils/format'
import exportService from '../services/exportService'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
  FiGlobe, FiTrendingUp, FiDollarSign, FiBarChart2, FiPackage,
  FiMapPin, FiCalendar, FiNavigation
} from 'react-icons/fi'

const CHART_COLORS = ['#3B82F6', '#00BCD4', '#00E676', '#FFD700', '#FF8A80', '#A78BFA', '#F472B6', '#14B8A6']
const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-theme-secondary text-xs font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.name.includes('€') ? formatCurrency(entry.value) : `${formatNumber(entry.value)}`}
        </p>
      ))}
    </div>
  )
}

export default function DashboardExport() {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['exportStats'],
    queryFn: exportService.getExportStats,
    refetchInterval: 10 * 60 * 1000,
  })

  // Données réelles pour les sparklines (tendance CA journalière 14j)
  const sparkline1 = useMemo(() => stats?.tendanceCA?.map(d => d.total) || [], [stats?.tendanceCA])
  const sparkline2 = useMemo(() => stats?.tendanceQuantite?.map(d => d.total) || [], [stats?.tendanceQuantite])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <Spinner size="xl" className="border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Dashboard Export</p>
            <p className="text-sm text-theme-tertiary mt-1">Analyse des exportations...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🌍</div>
          <p className="text-xl font-bold text-danger mb-2">Erreur de chargement</p>
          <p className="text-theme-tertiary text-sm mb-6">{error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-accent text-white rounded-pill hover:bg-accent-dark transition-all shadow-lg shadow-accent/20 text-sm font-medium">Réessayer</button>
        </div>
      </div>
    )
  }

  const p = stats?.previsions || {}
  const revenusParPays = stats?.revenusParPays || []
  const evolution = stats?.evolutionMensuelle || []
  const dernieresExport = stats?.dernieresExportations || []

  return (
    <div className="space-y-8 pb-12 page-enter">
      {/* ────── Header ────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-blue-500/20 rounded-2xl">
              <FiGlobe className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-3xl font-extrabold text-theme-primary tracking-tight">Export</h1>
          </div>
          <p className="text-theme-tertiary text-sm ml-1">Revenus export — Destinations — Analyse par pays</p>
        </div>
      </div>

      {/* ────── KPI Row ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="animate-slide-up animate-stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="CA Export (30j)" value={stats?.totalCAExport30j || 0} unit="Ar" icon={FiDollarSign} color="accent" sparklineData={sparkline1} />
        </div>
        <div className="animate-slide-up animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Volume exporté (30j)" value={stats?.totalQuantiteExport30j || 0} unit="kg" icon={FiPackage} color="primary" sparklineData={sparkline2} />
        </div>
        <div className="animate-slide-up animate-stagger-3 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Pays distincts (30j)" value={stats?.nbPays30j || 0} icon={FiNavigation} color="success" />
        </div>
      </div>

      {/* ────── Row 1 ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="animate-slide-up animate-stagger-4 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiGlobe} title="Revenus par Pays" subtitle="30 derniers jours" color="accent" />
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenusParPays} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="pays" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="CA (€)" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {revenusParPays.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="glass" className="animate-slide-up animate-stagger-5 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiBarChart2} title="Espèces Exportées" subtitle="Répartition par CA (30j)" color="primary" />
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.revenusParEspece} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                  paddingAngle={3} dataKey="total" label={({ espece, percent }) => `${espece} ${(percent * 100).toFixed(0)}%`}>
                  {stats?.revenusParEspece?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ────── Row 2 ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="animate-slide-up animate-stagger-6 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiTrendingUp} title="Évolution Mensuelle Export" subtitle="CA export — 90 derniers jours" color="success" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolution}>
                <defs>
                  <linearGradient id="exportGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00BCD4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#00BCD4" strokeWidth={2.5} fill="url(#exportGrad)" name="CA Export (€)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#00BCD4', fill: '#0B1120' }} />
                <Area type="monotone" dataKey="quantite" stroke="#00E676" strokeWidth={2} fill="none" name="Qté (kg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="glass" className="animate-slide-up animate-stagger-7 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiMapPin} title="Top Destinations" subtitle="Toutes périodes" color="warning" />
          {stats?.topDestinationsHistorique?.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {stats.topDestinationsHistorique.map((d, i) => {
                const maxTotal = stats.topDestinationsHistorique[0]?.total || 1
                const pct = (d.total / maxTotal) * 100
                return (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}>{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-theme-primary">{d.pays}</span>
                        <span className="font-bold text-theme-primary tabular-nums">{formatCurrency(d.total)}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 mt-1 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                      <p className="text-xs text-theme-tertiary mt-0.5">{formatNumber(d.quantite)} kg exportés</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-theme-tertiary"><FiGlobe className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucune donnée d'export</p></div>
          )}
        </Card>
      </div>

      {/* ────── Dernières Exportations ────── */}
      {dernieresExport.length > 0 && (
        <Card variant="glass" className="animate-slide-up animate-stagger-8 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiNavigation} title="Dernières Exportations" color="accent" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Espèce</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-theme-tertiary">Quantité</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-theme-tertiary">CA</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dernieresExport.map(e => (
                  <tr key={e.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 text-theme-secondary whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-accent/15 text-accent rounded-full text-xs font-semibold">{e.espece}</span></td>
                    <td className="px-4 py-2.5 text-right text-theme-secondary">{formatNumber(e.quantite)} kg</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-theme-primary tabular-nums">{formatCurrency(e.prixTotal)}</td>
                    <td className="px-4 py-2.5 flex items-center gap-1.5 text-theme-secondary"><FiMapPin className="w-3 h-3 text-accent" />{e.paysDestination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
