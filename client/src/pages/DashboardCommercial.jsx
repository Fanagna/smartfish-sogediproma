import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import KpiCard from '../components/dashboard/KpiCard'
import SectionHeader from '../components/dashboard/SectionHeader'
import { formatCurrency } from '../utils/format'
import commercialService from '../services/commercialService'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
  FiDollarSign, FiTrendingUp, FiBarChart2, FiUsers,
  FiShoppingCart, FiPackage, FiCalendar, FiStar
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

export default function DashboardCommercial() {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['commercialStats'],
    queryFn: commercialService.getCommercialStats,
    refetchInterval: 5 * 60 * 1000,
  })

  // Données réelles pour les sparklines (tendance CA journalière 14j)
  const sparkline1 = useMemo(() => stats?.tendanceCA?.map(d => d.total) || [], [stats?.tendanceCA])
  const sparkline2 = useMemo(() => stats?.tendanceQuantite?.map(d => d.total) || [], [stats?.tendanceQuantite])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <Spinner size="xl" className="border-success/30 border-t-success" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Dashboard Commercial</p>
            <p className="text-sm text-theme-tertiary mt-1">Analyse des ventes et clients...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-xl font-bold text-danger mb-2">Erreur de chargement</p>
          <p className="text-theme-tertiary text-sm mb-6">{error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-success text-white rounded-pill hover:bg-success-dark transition-all shadow-lg shadow-success/20 text-sm font-medium">Réessayer</button>
        </div>
      </div>
    )
  }

  const p = stats?.previsions || {}
  const caMensuel = stats?.caParMois || stats?.caAnnuel || []

  return (
    <div className="space-y-8 pb-12 page-enter">
      {/* ────── Header ────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-success/20 to-emerald-500/20 rounded-2xl">
              <FiShoppingCart className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-3xl font-extrabold text-theme-primary tracking-tight">Commercial</h1>
          </div>
          <p className="text-theme-tertiary text-sm ml-1">Ventes locales — Analyse clients — Prévisions</p>
        </div>
      </div>

      {/* ────── KPI Row ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="animate-slide-up animate-stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="CA Ventes (30j)" value={stats?.totalCAVentes30j || 0} unit="Ar" icon={FiDollarSign} color="success" sparklineData={sparkline1} />
        </div>
        <div className="animate-slide-up animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Qté vendue (30j)" value={stats?.totalQuantiteVendue30j || 0} unit="kg" icon={FiPackage} color="primary" sparklineData={sparkline2} />
        </div>
        <div className="animate-slide-up animate-stagger-3 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Panier moyen" value={stats?.panierMoyen || 0} unit="Ar" icon={FiStar} color="accent" />
        </div>
      </div>

      {/* ────── Row 1 ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="animate-slide-up animate-stagger-4 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiUsers} title="Ventes par Type de Client" subtitle="Répartition 30 jours" color="primary" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.ventesParTypeClient} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  paddingAngle={3} dataKey="total" label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}>
                  {stats?.ventesParTypeClient?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="glass" className="animate-slide-up animate-stagger-5 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiBarChart2} title="CA par Espèce" subtitle="Top espèces vendues (30j)" color="accent" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.ventesParEspece} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="espece" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="CA (€)" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {stats?.ventesParEspece?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ────── Row 2 ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="animate-slide-up animate-stagger-6 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiCalendar} title="Évolution du CA Mensuel" subtitle="90 derniers jours" color="success" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={caMensuel}>
                <defs>
                  <linearGradient id="caMoisGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E676" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00E676" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#00E676" strokeWidth={2.5} fill="url(#caMoisGrad)" name="CA (€)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#00E676', fill: '#0B1120' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="glass" className="animate-slide-up animate-stagger-7 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiBarChart2} title="Top Vendeurs" subtitle="Par chiffre d'affaires (30j)" color="warning" />
          {stats?.topVendeurs?.length > 0 ? (
            <div className="space-y-3">
              {stats.topVendeurs.map((v, i) => {
                const pct = stats.totalCAVentes30j > 0 ? ((v.total / stats.totalCAVentes30j) * 100).toFixed(1) : 0
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-warning/20 transition-all">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${i === 0 ? 'bg-warning' : i === 1 ? 'bg-gray-500' : i === 2 ? 'bg-orange-500' : 'bg-white/10 text-theme-tertiary'}`}>{i + 1}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-theme-primary text-sm">{v.nom}</p>
                      <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-warning to-orange-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="font-bold text-theme-primary text-sm tabular-nums">{formatCurrency(v.total)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-theme-tertiary"><FiUsers className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucune donnée</p></div>
          )}
        </Card>
      </div>

      {/* ────── Dernières Ventes ────── */}
      {stats?.dernieresVentes?.length > 0 && (
        <Card variant="glass" className="animate-slide-up animate-stagger-8 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiShoppingCart} title="Dernières Ventes" color="primary" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Espèce</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-theme-tertiary">Qté</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-theme-tertiary">Total</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.dernieresVentes.map(v => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 text-theme-secondary">{formatDate(v.date)}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-success/15 text-success rounded-full text-xs font-semibold">{v.espece}</span></td>
                    <td className="px-4 py-2.5 text-right text-theme-secondary">{formatNumber(v.quantite)} kg</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-theme-primary">{formatCurrency(v.total)}</td>
                    <td className="px-4 py-2.5 text-theme-secondary capitalize">{v.typeClient}</td>
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
