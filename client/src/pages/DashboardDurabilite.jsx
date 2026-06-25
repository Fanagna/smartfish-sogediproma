import { useQuery } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import KpiCard from '../components/dashboard/KpiCard'
import SectionHeader from '../components/dashboard/SectionHeader'
import durabiliteService from '../services/durabiliteService'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'
import {
  FiSun, FiAlertTriangle, FiGlobe,
  FiShield, FiBarChart2, FiAnchor, FiMapPin
} from 'react-icons/fi'

const formatNumber = (v, d = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-theme-secondary text-xs font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}/100
        </p>
      ))}
    </div>
  )
}

function ScoreRing({ score }) {
  const color = score >= 75 ? '#00E676' : score >= 50 ? '#FFD700' : '#FF8A80'
  const circumference = 97.4
  const dashLength = (score / 100) * circumference
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dashLength.toFixed(1)} ${(circumference - dashLength).toFixed(1)}`}
          strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <span className="absolute text-2xl font-extrabold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

function HeatmapCell({ poids, maxPoids }) {
  const intensity = maxPoids > 0 ? poids / maxPoids : 0
  const bg = intensity === 0 ? 'bg-white/5'
    : intensity > 0.7 ? 'bg-danger/60'
    : intensity > 0.4 ? 'bg-warning/50'
    : intensity > 0.15 ? 'bg-accent/30'
    : 'bg-success/25'
  return (
    <div className={`w-full aspect-square rounded-md ${bg} flex items-center justify-center text-[10px] font-bold text-theme-secondary transition-all hover:scale-110 hover:ring-2 hover:ring-primary/30`}
      title={`${poids.toFixed(1)} kg`}>
      {poids > 0 ? <span className="opacity-70">{formatNumber(poids, 0)}</span> : ''}
    </div>
  )
}

export default function DashboardDurabilite() {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['durabiliteStats'],
    queryFn: durabiliteService.getDurabiliteStats,
    refetchInterval: 30 * 60 * 1000,
  })

  // Pas de données tendance pour la durabilité — pas de sparkline

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Spinner size="xl" className="border-success/30 border-t-success" />
            <div className="absolute inset-0 flex items-center justify-center"><FiSun className="w-6 h-6 text-success animate-pulse-soft" /></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Dashboard Durabilité</p>
            <p className="text-sm text-theme-tertiary mt-1">Analyse environnementale en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🌿</div>
          <p className="text-xl font-bold text-danger mb-2">Erreur de chargement</p>
          <p className="text-theme-tertiary text-sm mb-6">{error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-success text-white rounded-pill hover:bg-success-dark transition-all shadow-lg shadow-success/20 text-sm font-medium">Réessayer</button>
        </div>
      </div>
    )
  }

  const especes = stats?.especes || []
  const zones = stats?.zones || []
  const alertes = stats?.alertesSurpeche || []
  const anomalies = stats?.anomalies || []
  const radarData = stats?.radarPerformance || []
  const heatmap = stats?.heatmap || { zones: [], mois: [], data: [] }

  return (
    <div className="space-y-8 pb-12 page-enter">
      {/* ────── Header ────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-success/20 to-emerald-500/20 rounded-2xl">
              <FiSun className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-3xl font-extrabold text-theme-primary tracking-tight">Durabilité</h1>
          </div>
          <p className="text-theme-tertiary text-sm ml-1">Espèces exploitées — Zones sensibles — Alertes surpêche</p>
        </div>
      </div>

      {/* ────── KPI Row ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="animate-slide-up animate-stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Espèces" value={stats?.totalEspeces || 0} icon={FiAnchor} color="success" />
        </div>
        <div className="animate-slide-up animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="En danger" value={stats?.especesEnDanger || 0} icon={FiAlertTriangle} color="danger" />
        </div>
        <div className="animate-slide-up animate-stagger-3 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <KpiCard title="Zones sensibles" value={stats?.zonesSensibles || 0} icon={FiMapPin} color="warning" />
        </div>
      </div>

      {/* ────── Row 1: Radar + Heatmap ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="animate-slide-up animate-stagger-4 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiBarChart2} title="Performance Environnementale" subtitle="6 axes d'évaluation" color="success" />
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="axe" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Radar name="Performance" dataKey="value" stroke="#00E676" fill="#00E676" fillOpacity={0.2} strokeWidth={2.5} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {radarData.map(r => (
              <div key={r.axe} className="text-center p-2 bg-white/5 rounded-xl">
                <p className="text-[10px] text-theme-tertiary truncate">{r.axe}</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: r.value >= 75 ? '#00E676' : r.value >= 50 ? '#FFD700' : '#FF8A80' }}>{r.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="glass" className="animate-slide-up animate-stagger-5 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiGlobe} title="Pression par Zone (Heatmap)" subtitle="Poids capturé par zone × mois" color="accent" />
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="flex mb-1">
                <div className="w-24 shrink-0" />
                {heatmap.mois.map(m => (
                  <div key={m} className="flex-1 text-center text-[10px] text-theme-tertiary font-medium truncate px-0.5">{m?.slice(5) || ''}</div>
                ))}
              </div>
              {heatmap.zones.map(zone => {
                const maxPoids = Math.max(...heatmap.data.filter(d => d.zone === zone).map(d => d.poids), 1)
                return (
                  <div key={zone} className="flex items-center mb-1 group">
                    <div className="w-24 shrink-0 text-[10px] text-theme-secondary font-medium truncate pr-2">{zone}</div>
                    {heatmap.mois.map(mois => {
                      const cell = heatmap.data.find(d => d.zone === zone && d.mois === mois)
                      return <div key={`${zone}-${mois}`} className="flex-1 px-0.5"><HeatmapCell poids={cell?.poids || 0} maxPoids={maxPoids} /></div>
                    })}
                  </div>
                )
              })}
              {heatmap.zones.length === 0 && (
                <div className="text-center py-8 text-theme-tertiary"><FiGlobe className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucune donnée de zone</p></div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-theme-tertiary">
            <span>Faible</span>
            <div className="flex gap-0.5">
              <div className="w-4 h-4 rounded bg-success/25" />
              <div className="w-4 h-4 rounded bg-accent/30" />
              <div className="w-4 h-4 rounded bg-warning/50" />
              <div className="w-4 h-4 rounded bg-danger/60" />
            </div>
            <span>Élevée</span>
          </div>
          {stats?.scoreGlobal !== undefined && (
            <div className="flex items-center justify-center mt-4 gap-3 p-3 bg-white/5 rounded-xl">
              <ScoreRing score={stats.scoreGlobal} />
              <div className="text-left">
                <p className="text-sm font-bold text-theme-primary">Score global de durabilité</p>
                <p className="text-xs text-theme-tertiary">
                  {stats.scoreGlobal >= 75 ? 'Excellent — Pratiques durables exemplaires' :
                   stats.scoreGlobal >= 50 ? 'Correct — Des améliorations possibles' :
                   'Attention — Des actions correctives nécessaires'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ────── Row 2: Espèces + Zones ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="animate-slide-up animate-stagger-6 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiAlertTriangle} title="Espèces Exploitées" subtitle={`${especes.filter(e => e.alerteSurpeche).length} en alerte`} color="danger" />
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {especes.slice(0, 20).map((e, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                e.alerteSurpeche ? 'bg-danger/5 border-danger/20' : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  e.scoreVulnerabilite >= 4 ? 'bg-danger' : e.scoreVulnerabilite >= 3 ? 'bg-warning' : 'bg-success'
                }`}>{e.scoreVulnerabilite}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-theme-primary text-sm">{e.espece}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      e.tendance === 'hausse' ? 'bg-danger/20 text-danger' :
                      e.tendance === 'legere_hausse' ? 'bg-warning/20 text-warning' :
                      e.tendance === 'baisse' ? 'bg-success/20 text-success' :
                      e.tendance === 'legere_baisse' ? 'bg-success/15 text-success' :
                      'bg-white/10 text-theme-tertiary'
                    }`}>{e.tendance?.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-theme-tertiary mt-0.5">{formatNumber(e.totalQuantite)} captures — {formatNumber(e.totalPoids, 1)} kg</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${e.scoreVulnerabilite >= 4 ? 'bg-danger' : e.scoreVulnerabilite >= 3 ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${(e.scoreVulnerabilite / 5) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {especes.length === 0 && <p className="text-center py-8 text-theme-tertiary">Aucune espèce</p>}
          </div>
        </Card>

        <Card variant="glass" className="animate-slide-up animate-stagger-7 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiMapPin} title="Zones de Pêche & Sensibilité" subtitle={`${zones.filter(z => z.zoneSensible).length} zones sensibles`} color="warning" />
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {zones.map((z, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                z.zoneSensible ? 'bg-warning/5 border-warning/20' : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}>
                <div className={`p-1.5 rounded-lg ${z.zoneSensible ? 'bg-warning/20 text-warning' : 'bg-white/5 text-theme-tertiary'}`}><FiMapPin className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-theme-primary text-sm">{z.zone}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${z.zoneSensible ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>{z.zoneSensible ? 'Sensible' : 'OK'}</span>
                  </div>
                  <p className="text-xs text-theme-tertiary mt-0.5">{formatNumber(z.totalCaptures)} opérations — {formatNumber(z.especesDifferentes)} espèces</p>
                </div>
              </div>
            ))}
            {zones.length === 0 && <p className="text-center py-8 text-theme-tertiary">Aucune zone</p>}
          </div>
        </Card>
      </div>

      {/* ────── Alertes Surpêche ────── */}
      {alertes.length > 0 && (
        <Card variant="glass" className="animate-slide-up animate-stagger-8 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={FiAlertTriangle} title="Alertes Surpêche" subtitle={`${alertes.length} espèce(s) nécessitent une action immédiate`} color="danger" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alertes.map((a, i) => (
              <div key={i} className="p-4 bg-danger/5 rounded-2xl border border-danger/20 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <h4 className="font-bold text-theme-primary">{a.espece}</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-danger/15 text-danger rounded-full text-xs font-bold">Score {a.scoreVulnerabilite}/5</span>
                </div>
                <p className="text-sm text-theme-secondary"><span className="font-medium">Tendance:</span> {a.tendance?.replace(/_/g, ' ')}</p>
                <p className="text-sm text-theme-secondary mt-1"><span className="font-medium">Recommandation:</span> {a.recommandation}</p>
                <div className="mt-2 w-full bg-danger/10 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-danger rounded-full" style={{ width: `${(a.scoreVulnerabilite / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ────── Anomalies ────── */}
      {anomalies.length > 0 && (
        <Card variant="glass">
          <SectionHeader icon={FiShield} title="Anomalies Environnementales" subtitle={`${anomalies.length} signalement(s)`} color="accent" />
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {anomalies.slice(0, 10).map((a, i) => (
              <div key={a.id || i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className={`p-1 rounded-lg ${a.urgence === 'CRITIQUE' || a.urgence === 'HAUTE' ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent'}`}>
                  <FiAlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-theme-primary">{a.description}</p>
                  <p className="text-xs text-theme-tertiary mt-0.5">{a.type} — {a.urgence} — {a.date ? new Date(a.date).toLocaleDateString('fr-FR') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
