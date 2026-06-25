import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import SectionHeader from '../components/dashboard/SectionHeader'
import KpiCard from '../components/dashboard/KpiCard'
import { formatCurrency } from '../utils/format'
import dashboardService from '../services/dashboardService'
import {
  FiCpu, FiTarget,
  FiZap, FiActivity, FiDollarSign, FiBarChart2,
  FiStar, FiArrowUp, FiArrowDown, FiMapPin, FiShoppingBag,
  FiClock, FiAnchor, FiPackage
} from 'react-icons/fi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const formatNumber = (val, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(val ?? 0)
const formatPct = (val) => val != null ? `${val > 0 ? '+' : ''}${val.toFixed(1)}%` : '—'
const formatHeures = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'

const CHART_COLORS = ['#00BCD4', '#3B82F6', '#00E676', '#FFD700', '#FF8A80', '#A78BFA', '#F472B6', '#14B8A6']

// ─── Badge tendance prix ───
function PriceTrendBadge({ trend }) {
  const config = {
    hausse: { icon: <FiArrowUp className="w-3.5 h-3.5" />, color: 'text-success bg-success/10', label: 'Hausse' },
    baisse: { icon: <FiArrowDown className="w-3.5 h-3.5" />, color: 'text-danger bg-danger/10', label: 'Baisse' },
    stable: { icon: <FiActivity className="w-3.5 h-3.5" />, color: 'text-accent bg-accent/10', label: 'Stable' },
  }
  const c = config[trend] || config.stable
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${c.color}`}>
      {c.icon} {c.label}
    </span>
  )
}

// ─── Badge impact ───
function ImpactBadge({ impact }) {
  const colors = {
    critique: 'bg-danger/15 text-danger border-danger/20',
    élevé: 'bg-warning/15 text-warning border-warning/20',
    haut: 'bg-warning/15 text-warning border-warning/20',
    moyen: 'bg-accent/15 text-accent border-accent/20',
    bas: 'bg-success/15 text-success border-success/20'
  }
  const c = colors[impact] || colors.moyen
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${c}`}>{impact}</span>
}

// ─── Jauge de score ───
function ScoreBar({ score, label }) {
  const color = score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-danger'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-theme-surface rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger'}`}>
        {score}/100
      </span>
    </div>
  )
}

// ─── Custom Tooltip ───
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-theme-secondary text-xs font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.name.includes('Ar') ? formatCurrency(entry.value) : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function DashboardIA() {
  const { data: dashboard, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardPredictif'],
    queryFn: dashboardService.getDashboardPredictif,
    refetchInterval: 15 * 60 * 1000,
    retry: 2,
    retryDelay: 1000
  })

  // Pas de sparkline — les données sont agrégées sur 30j, pas de distribution journalière disponible
  // On préfère ne pas montrer de fausses données

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Spinner size="xl" className="border-accent/30 border-t-accent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FiCpu className="w-6 h-6 text-accent animate-pulse-soft" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Dashboard IA Prédictif</p>
            <p className="text-sm text-theme-tertiary mt-1">Analyse des prix, zones et recommandations...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🤖</div>
          <p className="text-xl font-bold text-danger mb-2">Analyse indisponible</p>
          <p className="text-theme-tertiary text-sm mb-6">{error?.message || 'Impossible de récupérer les données prédictives'}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-accent text-white rounded-pill hover:bg-accent-dark transition-all shadow-lg shadow-accent/20 text-sm font-medium">Réessayer</button>
        </div>
      </div>
    )
  }

  const kpis = dashboard?.kpis || {}
  const analysePrix = dashboard?.analysePrix || []
  const performanceZones = dashboard?.performanceZones || []
  const recommandations = dashboard?.recommandations || []
  const evolutionCaptures = dashboard?.evolutionCaptures || 0

  return (
    <div className="space-y-8 pb-12 page-enter">
      {/* ────── Header ────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-2xl">
              <FiCpu className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-3xl font-extrabold text-theme-primary tracking-tight">Dashboard IA Prédictif</h1>
            <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold">Temps réel</span>
          </div>
          <p className="text-theme-tertiary text-sm ml-1">
            Analyse marché — Zones optimales — Recommandations métier — Période: 30 jours
          </p>
        </div>
      </div>

      {/* ────── KPIs ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-slide-up animate-stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Captures (30j)" value={kpis.totalCaptures || 0} icon={FiActivity} color="accent" delta={evolutionCaptures} deltaLabel="vs période précédente" />
        </div>
        <div className="animate-slide-up animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Poids total (30j)" value={kpis.totalPoids ? `${formatNumber(kpis.totalPoids)} kg` : '—'} icon={FiBarChart2} color="primary" />
        </div>
        <div className="animate-slide-up animate-stagger-3 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="CA Ventes (30j)" value={kpis.totalCA ? formatCurrency(kpis.totalCA) : '—'} icon={FiDollarSign} color="success" />
        </div>
        <div className="animate-slide-up animate-stagger-4 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="CA journalier moyen" value={kpis.caMoyenJournalier ? formatCurrency(kpis.caMoyenJournalier) : '—'} icon={FiClock} color="warning" />
        </div>
      </div>

      {/* ────── Section 1 : Analyse des prix du marché ────── */}
      <Card variant="glass" className="animate-slide-up animate-stagger-5 opacity-0" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={FiShoppingBag} title="Analyse des Prix du Marché" subtitle={`${analysePrix.length} espèces suivies — Prix moyen par kg`} color="success" />

        {analysePrix.length > 0 ? (
          <div className="space-y-4">
            {/* Graphique des prix */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysePrix} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="espece" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="prixMoyen" name="Prix moyen (Ar/kg)" radius={[0, 6, 6, 0]} maxBarSize={18}>
                    {analysePrix.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Liste des prix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {analysePrix.slice(0, 8).map((p, i) => (
                <div key={i} className="p-3 rounded-xl border transition-all hover:shadow-md"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-theme-primary">{p.espece}</span>
                    <PriceTrendBadge trend={p.tendance} />
                  </div>
                  <p className="text-lg font-bold text-theme-primary tabular-nums">{p.prixMoyen.toLocaleString('fr-FR')} <span className="text-xs text-theme-tertiary font-normal">Ar/kg</span></p>
                  <div className="flex items-center justify-between mt-1 text-xs text-theme-tertiary">
                    <span>Min: {p.prixMin.toLocaleString('fr-FR')}</span>
                    <span>Max: {p.prixMax.toLocaleString('fr-FR')}</span>
                  </div>
                  <p className="text-xs text-theme-tertiary mt-1">{p.nbVentes} ventes — {formatCurrency(p.caTotal)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-theme-tertiary">
            <FiShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune donnée de vente disponible pour l'analyse des prix</p>
          </div>
        )}
      </Card>

      {/* ────── Section 2 : Zones de pêche optimales ────── */}
      <Card variant="glass" className="animate-slide-up animate-stagger-6 opacity-0" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={FiMapPin} title="Performance des Zones de Pêche" subtitle={`${performanceZones.length} zones analysées — Classement par score`} color="accent" />

        {performanceZones.length > 0 ? (
          <div className="space-y-3">
            {performanceZones.map((z, i) => (
              <div key={i} className="group p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      i === 0 ? 'bg-warning/20 text-warning' :
                      i === 1 ? 'bg-white/10 text-theme-secondary' :
                      i === 2 ? 'bg-accent/20 text-accent' : 'bg-white/5 text-theme-tertiary'
                    }`}>
                      <FiMapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-theme-primary">{z.zone}</span>
                      {i === 0 && <span className="ml-2 px-1.5 py-0.5 bg-warning/15 text-warning rounded-full text-[10px] font-bold">🌟 Meilleure zone</span>}
                    </div>
                  </div>
                  <ScoreBar score={z.score} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <p className="text-lg font-bold text-theme-primary">{formatNumber(z.poidsTotal)} kg</p>
                    <p className="text-[10px] text-theme-tertiary">Poids total</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <p className="text-lg font-bold text-theme-primary">{z.nbCaptures}</p>
                    <p className="text-[10px] text-theme-tertiary">Opérations</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <p className="text-lg font-bold text-theme-primary">{z.nbEspeces}</p>
                    <p className="text-[10px] text-theme-tertiary">Espèces</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-theme-tertiary">
                  <span>Rendement: {z.rendementMoyen} kg/opération</span>
                  <span>Score: {z.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-theme-tertiary">
            <FiMapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune donnée de zone disponible</p>
          </div>
        )}
      </Card>

      {/* ────── Section 3 : Recommandations Métier ────── */}
      <Card variant="glass" className="animate-slide-up animate-stagger-7 opacity-0" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={FiTarget} title="Recommandations Métier Actionnables"
          subtitle={`${recommandations.length} recommandation(s) basée(s) sur les données réelles`}
          color="warning" />

        {recommandations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommandations.map((rec, i) => (
              <div key={i} className="group p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: rec.impact === 'critique' ? 'var(--color-danger)' :
                    rec.impact === 'élevé' || rec.impact === 'haut' ? 'var(--color-warning)' : 'var(--border-default)',
                  borderWidth: rec.impact === 'critique' || rec.impact === 'élevé' ? '2px' : '1px'
                }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${
                      rec.type === 'zone' ? 'bg-accent/20 text-accent' :
                      rec.type === 'prix' ? 'bg-success/20 text-success' :
                      rec.type === 'stock' ? 'bg-danger/20 text-danger' :
                      rec.type === 'flotte' ? 'bg-warning/20 text-warning' : 'bg-purple-500/20 text-purple-500'
                    }`}>
                      {rec.type === 'zone' ? <FiMapPin className="w-4 h-4" /> :
                       rec.type === 'prix' ? <FiDollarSign className="w-4 h-4" /> :
                       rec.type === 'stock' ? <FiPackage className="w-4 h-4" /> :
                       rec.type === 'flotte' ? <FiAnchor className="w-4 h-4" /> :
                       <FiStar className="w-4 h-4" />}
                    </div>
                    <h4 className="font-bold text-theme-primary text-sm">{rec.titre}</h4>
                  </div>
                  <ImpactBadge impact={rec.impact} />
                </div>
                <p className="text-sm text-theme-secondary leading-relaxed mb-3">{rec.description}</p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <FiZap className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-xs font-medium text-theme-primary">{rec.action}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-theme-tertiary">
            <FiTarget className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune recommandation pour le moment — tout est sous contrôle</p>
          </div>
        )}
      </Card>

      {/* ────── Footer ────── */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/5 rounded-full border border-accent/10">
          <FiCpu className="w-4 h-4 text-accent" />
          <p className="text-xs text-theme-tertiary">
            Analyse basée sur <span className="font-bold text-accent">données réelles</span> (30 jours) — 
            {kpis.nbEspeces || 0} espèces suivies — {kpis.nbZones || 0} zones analysées
          </p>
        </div>
      </div>
    </div>
  )
}
