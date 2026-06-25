import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import KpiCard from '../components/dashboard/KpiCard'
import SectionHeader from '../components/dashboard/SectionHeader'
import operationnelService from '../services/operationnelService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  FiAnchor, FiDroplet, FiActivity, FiAlertTriangle,
  FiTrendingUp, FiSettings, FiRefreshCw, FiMapPin, FiWifi, FiCheckCircle, FiNavigation,
  FiClock, FiDollarSign, FiZap
} from 'react-icons/fi'

const CHART_COLORS = ['#3B82F6', '#00BCD4', '#00E676', '#FFD700', '#FF8A80', '#A78BFA', '#F472B6', '#14B8A6']
const formatNumber = (val, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(val ?? 0)
const formatCurrency = (val) => val != null ? `${(val / 1000).toFixed(0)}k Ar` : '—'
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const formatHour = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'
const formatHeures = (h) => {
  if (!h || h === 0) return '—'
  const heures = Math.floor(h)
  const minutes = Math.round((h % 1) * 60)
  return `${heures}h${minutes > 0 ? minutes : ''}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-theme-secondary text-xs font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.name.includes('kg') ? `${entry.value.toFixed(1)} kg` : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Indicateur d'autonomie ───
function AutonomieBadge({ autonomie }) {
  if (!autonomie || !autonomie.totalHeures) {
    return <span className="text-xs text-theme-tertiary">—</span>
  }
  const heures = autonomie.totalHeures
  let color = 'text-success bg-success/10'
  let icon = '🟢'
  if (heures < 2) { color = 'text-danger bg-danger/10'; icon = '🔴' }
  else if (heures < 6) { color = 'text-warning bg-warning/10'; icon = '🟡' }
  else if (heures < 12) { color = 'text-accent bg-accent/10'; icon = '🔵' }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${color}`}>
      {icon} {formatHeures(heures)}
    </span>
  )
}

// ─── Barre de carburant avec seuil critique ───
function FuelBar({ ratio, restant, capacity }) {
  const color = ratio > 50 ? 'bg-success' : ratio > 25 ? 'bg-warning' : 'bg-danger'
  const estCritique = ratio <= 15
  return (
    <div className="relative">
      <div className="w-full bg-theme-surface rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(ratio, 100)}%` }} />
      </div>
      {estCritique && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full animate-ping" />
      )}
    </div>
  )
}

// ─── Statut Badge ───
function StatutBadge({ statut }) {
  const config = {
    ACTIF: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/20', label: '🟢 Actif' },
    ALERTE: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/20', label: '🟡 Carburant bas' },
    CRITIQUE: { bg: 'bg-danger/15', text: 'text-danger', border: 'border-danger/20 animate-pulse-soft', label: '🔴 Critique' },
    INACTIF: { bg: 'bg-white/5', text: 'text-theme-tertiary', border: 'border-white/10', label: '⚪ Inactif' },
  }
  const s = config[statut] || config.INACTIF
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
}

// ─── Alerte Dérive ───
function AlerteDeriveItem({ alerte }) {
  const colors = {
    CRITIQUE: 'bg-danger/10 border-danger/20 text-danger',
    HAUTE: 'bg-warning/10 border-warning/20 text-warning',
    MOYENNE: 'bg-accent/10 border-accent/20 text-accent'
  }
  const c = colors[alerte.urgence] || colors.MOYENNE
  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg border ${c}`}>
      <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium">{alerte.description}</p>
        {alerte.date && <p className="text-[10px] opacity-70 mt-0.5">{formatDate(alerte.date)}</p>}
      </div>
    </div>
  )
}

// ─── Composant Carte Bateau ───
function BateauCard({ bateau }) {
  return (
    <div className="group p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: bateau.statut === 'CRITIQUE' ? 'var(--color-danger)' : bateau.statut === 'ALERTE' ? 'var(--color-warning)' : 'var(--border-default)',
        borderWidth: bateau.statut === 'CRITIQUE' ? '2px' : '1px'
      }}>
      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            bateau.statut === 'ACTIF' ? 'bg-success/15' :
            bateau.statut === 'CRITIQUE' ? 'bg-danger/15' :
            bateau.statut === 'ALERTE' ? 'bg-warning/15' : 'bg-white/5'
          }`}>
            <FiNavigation className={`w-4 h-4 ${
              bateau.statut === 'ACTIF' ? 'text-success' :
              bateau.statut === 'CRITIQUE' ? 'text-danger' :
              bateau.statut === 'ALERTE' ? 'text-warning' : 'text-theme-tertiary'
            }`} />
          </div>
          <div>
            <p className="font-semibold text-theme-primary text-sm">{bateau.nom}</p>
            <p className="text-[10px] text-theme-tertiary">{bateau.type} • {bateau.immatriculation}</p>
          </div>
        </div>
        <StatutBadge statut={bateau.statut} />
      </div>

      {/* Informations en grille */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Carburant */}
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-theme-tertiary">Carburant</span>
            <span className={`text-xs font-bold ${
              bateau.carburant > 50 ? 'text-success' : bateau.carburant > 25 ? 'text-warning' : 'text-danger'
            }`}>{bateau.carburant}%</span>
          </div>
          <FuelBar ratio={bateau.carburant} restant={bateau.carburantRestant} capacity={bateau.carburantCapacity} />
          <p className="text-[10px] text-theme-tertiary mt-1">{bateau.carburantRestant.toFixed(0)}L / {bateau.carburantCapacity}L</p>
        </div>

        {/* Autonomie */}
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-1 mb-1">
            <FiClock className="w-3 h-3 text-theme-tertiary" />
            <span className="text-[10px] text-theme-tertiary">Autonomie</span>
          </div>
          <p className={`text-lg font-bold ${
            bateau.autonomie?.totalHeures < 2 ? 'text-danger' :
            bateau.autonomie?.totalHeures < 6 ? 'text-warning' : 'text-success'
          }`}>{formatHeures(bateau.autonomie?.totalHeures)}</p>
          <p className="text-[10px] text-theme-tertiary">~{bateau.autonomie?.autonomieKm || 0} km</p>
        </div>

        {/* Performance */}
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-1 mb-1">
            <FiZap className="w-3 h-3 text-theme-tertiary" />
            <span className="text-[10px] text-theme-tertiary">Rendement</span>
          </div>
          <p className="text-base font-bold text-theme-primary">{bateau.efficaciteCarburant || '—'}</p>
          <p className="text-[10px] text-theme-tertiary">kg/L</p>
        </div>

        {/* Coûts */}
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-1 mb-1">
            <FiDollarSign className="w-3 h-3 text-theme-tertiary" />
            <span className="text-[10px] text-theme-tertiary">Coût 30j</span>
          </div>
          <p className="text-base font-bold text-theme-primary">
            {bateau.coutsEstimes ? formatCurrency(bateau.coutsEstimes.coutTotal) : '—'}
          </p>
          <p className="text-[10px] text-theme-tertiary">{bateau.totalCaptures30j || 0} sorties</p>
        </div>
      </div>

      {/* Dernière activité */}
      {bateau.derniereCapture ? (
        <div className="flex items-center justify-between text-[10px] text-theme-tertiary pt-2 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}>
          <span>🐟 {bateau.derniereCapture.espece} — {bateau.derniereCapture.poids.toFixed(1)} kg</span>
          <span>{formatDate(bateau.derniereCapture.date)}</span>
        </div>
      ) : (
        <div className="text-[10px] text-theme-tertiary pt-2 border-t italic"
          style={{ borderColor: 'var(--border-subtle)' }}>
          Aucune capture
        </div>
      )}
    </div>
  )
}

export default function DashboardOperationnel() {
  const [showBateauxCritiques, setShowBateauxCritiques] = useState(false)

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['operationnelStats'],
    queryFn: operationnelService.getOperationnelStats,
    refetchInterval: 60 * 1000,
  })

  const sparkline1 = useMemo(() => stats?.capturesParJour?.slice(-14).map(d => d.totalPoids) || [], [stats?.capturesParJour])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Spinner size="xl" className="border-accent/30 border-t-accent" />
            <div className="absolute inset-0 flex items-center justify-center"><FiWifi className="w-6 h-6 text-accent animate-pulse-soft" /></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Tableau de Bord Opérationnel</p>
            <p className="text-sm text-theme-tertiary mt-1">Calcul autonomie, coûts et performances...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚓</div>
          <p className="text-xl font-bold text-danger mb-2">Erreur de chargement</p>
          <p className="text-theme-tertiary text-sm mb-6">{error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-accent text-white rounded-pill hover:bg-accent-dark transition-all shadow-lg shadow-accent/20 text-sm font-medium">Réessayer</button>
        </div>
      </div>
    )
  }

  const f = stats?.flotteStats || {}
  const etatBateaux = stats?.etatBateaux || []
  const capturesRealtime = stats?.capturesRealtime || []
  const anomalies = stats?.anomaliesActives || []
  const alertesDerive = stats?.alertesDerive || []
  const alertesInactivite = stats?.alertesInactivite || []
  const maintenances = stats?.maintenances || []
  const stocksAlertes = stats?.stocksAlertes || []
  const capturesParJour = stats?.capturesParJour || []
  const totalAlertes = alertesDerive.length + alertesInactivite.length + anomalies.length

  // Bateaux filtrés par statut
  const bateauxCritiques = etatBateaux.filter(b => b.statut === 'CRITIQUE' || b.statut === 'ALERTE')
  const bateauxNormaux = showBateauxCritiques
    ? etatBateaux.filter(b => b.statut === 'ACTIF' || b.statut === 'INACTIF')
    : etatBateaux.filter(b => b.statut !== 'CRITIQUE' && b.statut !== 'ALERTE')

  return (
    <div className="space-y-8 pb-12 page-enter">
      {/* ────── Header ────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl">
              <FiActivity className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-3xl font-extrabold text-theme-primary tracking-tight">Opérationnel</h1>
            {totalAlertes > 0 && (
              <span className="px-2.5 py-1 bg-danger/15 text-danger rounded-full text-xs font-bold animate-pulse-soft">
                {totalAlertes} alerte{totalAlertes > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-theme-tertiary text-sm ml-1">
            {f.total} bateaux — {f.actifs} actifs — Autonomie moyenne: {formatHeures(f.autonomieMoyenneFlotte)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-theme-tertiary">
          <FiRefreshCw className="w-3 h-3" />
          Temps réel (60s)
        </div>
      </div>

      {/* ────── Alertes Dérive ────── */}
      {(alertesDerive.length > 0 || alertesInactivite.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-down">
          {alertesDerive.length > 0 && (
            <Card variant="glass" className="!p-3 border-danger/20">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertTriangle className="w-4 h-4 text-danger" />
                <h3 className="text-sm font-bold text-danger">⛽ Alertes Carburant</h3>
                <span className="ml-auto px-2 py-0.5 bg-danger/15 text-danger rounded-full text-xs font-bold">{alertesDerive.length}</span>
              </div>
              <div className="space-y-2">
                {alertesDerive.map(a => <AlerteDeriveItem key={a.id} alerte={a} />)}
              </div>
            </Card>
          )}
          {alertesInactivite.length > 0 && (
            <Card variant="glass" className="!p-3 border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <FiClock className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-bold text-warning">🚫 Alertes Inactivité</h3>
                <span className="ml-auto px-2 py-0.5 bg-warning/15 text-warning rounded-full text-xs font-bold">{alertesInactivite.length}</span>
              </div>
              <div className="space-y-2">
                {alertesInactivite.map(a => <AlerteDeriveItem key={a.id} alerte={a} />)}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ────── KPIs ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-slide-up animate-stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Flotte totale" value={f.total || 0} unit="navires" icon={FiAnchor} color="primary" sparklineData={sparkline1} />
        </div>
        <div className="animate-slide-up animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Bateaux actifs" value={f.actifs || 0} icon={FiNavigation} color="success" />
        </div>
        <div className="animate-slide-up animate-stagger-3 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Autonomie moyenne" value={f.autonomieMoyenneFlotte ? `${formatHeures(f.autonomieMoyenneFlotte)}` : '—'} icon={FiClock} color="accent" />
        </div>
        <div className="animate-slide-up animate-stagger-4 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Captures aujourd'hui" value={stats?.capturesToday || 0} icon={FiTrendingUp} color="warning" />
        </div>
      </div>

      {/* ────── Flotte : Grille de bateaux ────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={FiAnchor} title="État de la Flotte"
            subtitle={`${etatBateaux.length} bateaux — ${bateauxCritiques.length} en alerte`}
            color="primary" />
          {bateauxCritiques.length > 0 && (
            <button
              onClick={() => setShowBateauxCritiques(!showBateauxCritiques)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                !showBateauxCritiques
                  ? 'bg-danger/10 text-danger hover:bg-danger/20'
                  : 'bg-accent/10 text-accent hover:bg-accent/20'
              }`}>
              {showBateauxCritiques ? 'Voir tous' : `🚨 ${bateauxCritiques.length} critique(s)`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bateauxCritiques.map(b => (
            <div key={b.id} className="animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
              <BateauCard bateau={b} />
            </div>
          ))}
          {showBateauxCritiques && bateauxNormaux.map(b => (
            <div key={b.id} className="animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
              <BateauCard bateau={b} />
            </div>
          ))}
          {!showBateauxCritiques && bateauxNormaux.slice(0, 6).map(b => (
            <div key={b.id} className="animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
              <BateauCard bateau={b} />
            </div>
          ))}
        </div>

        {etatBateaux.length === 0 && (
          <div className="text-center py-8 text-theme-tertiary">
            <FiAnchor className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun bateau dans la flotte</p>
          </div>
        )}
      </div>

      {/* ────── Captures temps réel + Graphique ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiWifi} title="Captures Temps Réel" subtitle={`${capturesRealtime.length} dernières opérations`} color="success" />
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
            {capturesRealtime.map(c => (
              <div key={c.id} className="group flex items-center gap-3 p-2.5 bg-gradient-to-r from-success/5 to-transparent rounded-xl border border-success/10 hover:border-success/20 transition-all">
                <div className="p-1.5 bg-success/20 rounded-lg"><FiTrendingUp className="w-3.5 h-3.5 text-success" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-theme-primary text-sm">{c.espece}</span>
                    <span className="text-xs text-theme-tertiary">{formatHour(c.date)}</span>
                  </div>
                  <p className="text-xs text-theme-tertiary mt-0.5">{formatNumber(c.poids)} kg • {c.quantite} pcs • {c.zonePeche}{c.bateau ? ` • ${c.bateau}` : ''}</p>
                </div>
              </div>
            ))}
            {capturesRealtime.length === 0 && <p className="text-center py-8 text-theme-tertiary">Aucune capture récente</p>}
          </div>
        </Card>

        <Card variant="glass" className="animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiTrendingUp} title="Captures (30 jours)" subtitle="Poids par jour" color="accent" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capturesParJour.map(d => ({ ...d, dateF: d.date?.slice(5) || '' }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="dateF" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalPoids" name="Poids (kg)" radius={[4, 4, 0, 0]} maxBarSize={16}>
                  {capturesParJour.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ────── Alertes & Maintenances ────── */}
      <Card variant="glass" className="animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={FiAlertTriangle} title="Alertes & Anomalies"
          subtitle={`${anomalies.length} anomalies • ${maintenances.length} maintenances • ${stocksAlertes.length} stocks sous seuil`}
          color="danger" />
        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {anomalies.sort((a, b) => a.priorite - b.priorite).map(a => (
            <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
              a.urgence === 'CRITIQUE' ? 'bg-danger/10 border-danger/20' :
              a.urgence === 'HAUTE' ? 'bg-warning/10 border-warning/20' : 'bg-white/5 border-white/5'
            }`}>
              <div className={`p-1 rounded-lg ${a.urgence === 'CRITIQUE' ? 'bg-danger/20' : a.urgence === 'HAUTE' ? 'bg-warning/20' : 'bg-white/5'}`}>
                <FiAlertTriangle className={`w-3.5 h-3.5 ${a.urgence === 'CRITIQUE' ? 'text-danger' : a.urgence === 'HAUTE' ? 'text-warning' : 'text-theme-tertiary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-theme-primary truncate">{a.description}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    a.urgence === 'CRITIQUE' ? 'bg-danger/20 text-danger' :
                    a.urgence === 'HAUTE' ? 'bg-warning/20 text-warning' : 'bg-white/10 text-theme-tertiary'
                  }`}>{a.urgence}</span>
                </div>
                <p className="text-xs text-theme-tertiary mt-0.5">{a.type} • {formatDate(a.date)}</p>
              </div>
            </div>
          ))}
          {maintenances.map(m => (
            <div key={m.id} className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
              <div className="p-1 bg-purple-500/20 rounded-lg"><FiSettings className="w-3.5 h-3.5 text-purple-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-theme-primary">{m.type} — {m.bateau?.nom}</p>
                <p className="text-xs text-theme-tertiary">{m.description} • {formatDate(m.date)}</p>
              </div>
            </div>
          ))}
          {stocksAlertes.map(s => (
            <div key={s.id} className="flex items-start gap-3 p-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
              <div className="p-1 bg-orange-500/20 rounded-lg"><FiDroplet className="w-3.5 h-3.5 text-orange-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-theme-primary">{s.espece} — {s.bateau?.nom}</p>
                <p className="text-xs text-theme-tertiary">{s.quantite} {s.unite} (seuil: {s.seuil})</p>
              </div>
            </div>
          ))}
          {anomalies.length === 0 && maintenances.length === 0 && stocksAlertes.length === 0 && (
            <div className="text-center py-8">
              <FiCheckCircle className="w-10 h-10 mx-auto text-success mb-2" />
              <p className="text-sm text-theme-tertiary">Aucune alerte — tout est vert ✓</p>
            </div>
          )}
        </div>
      </Card>

      {/* ────── Résumé Coûts Opérationnels ────── */}
      {etatBateaux.some(b => b.coutsEstimes) && (
        <Card variant="glass" className="animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiDollarSign} title="Coûts Opérationnels Estimés (30j)" color="warning" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(() => {
              const totalCarburant = etatBateaux.reduce((s, b) => s + (b.coutsEstimes?.coutCarburant || 0), 0)
              const totalMaintenance = etatBateaux.reduce((s, b) => s + (b.coutsEstimes?.coutMaintenance || 0), 0)
              const totalEquipage = etatBateaux.reduce((s, b) => s + (b.coutsEstimes?.coutEquipage || 0), 0)
              const totalGeneral = etatBateaux.reduce((s, b) => s + (b.coutsEstimes?.coutTotal || 0), 0)
              const totalLitre = etatBateaux.reduce((s, b) => s + (b.coutsEstimes?.litresConsommes || 0), 0)
              return (
                <>
                  <div className="p-4 rounded-xl bg-warning/5 border border-warning/10">
                    <p className="text-xs text-theme-tertiary font-medium">Coût Carburant</p>
                    <p className="text-2xl font-bold text-warning">{formatCurrency(totalCarburant)}</p>
                    <p className="text-xs text-theme-tertiary mt-1">~{formatNumber(totalLitre)}L à 4800 Ar/L</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <p className="text-xs text-theme-tertiary font-medium">Coût Maintenance</p>
                    <p className="text-2xl font-bold text-purple-500">{formatCurrency(totalMaintenance)}</p>
                    <p className="text-xs text-theme-tertiary mt-1">~15% du coût carburant</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                    <p className="text-xs text-theme-tertiary font-medium">Coût Équipage</p>
                    <p className="text-2xl font-bold text-accent">{formatCurrency(totalEquipage)}</p>
                    <p className="text-xs text-theme-tertiary mt-1">~2000 Ar/h par sortie</p>
                  </div>
                  <div className="sm:col-span-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-theme-tertiary font-medium">Coût Opérationnel Total Estimé (30j)</p>
                        <p className="text-xs text-theme-tertiary mt-0.5">CA journalier estimé: {formatCurrency(stats?.caJournalierEstime || 0)}</p>
                      </div>
                      <p className="text-3xl font-extrabold text-primary">{formatCurrency(totalGeneral)}</p>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </Card>
      )}
    </div>
  )
}
