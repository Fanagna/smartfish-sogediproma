import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPredictionsMaintenance } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FiSettings, FiAlertTriangle, FiClock, FiCalendar, FiAnchor, FiCheckCircle, FiRefreshCw, FiInfo, FiBarChart2 } from 'react-icons/fi'

const CHART_COLORS = ['#F71735', '#FBB13C', '#20BF55', '#0B4F6C', '#7C3AED', '#EC4899']
const PRIORITE_COLORS = { haute: 'bg-danger/10 text-danger', moyenne: 'bg-warning/10 text-warning', basse: 'bg-success/10 text-success' }
const PRIORITE_DOTS = { haute: 'bg-danger', moyenne: 'bg-warning', basse: 'bg-success' }

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const formatNumber = (v, d = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)

function PrioriteBadge({ priorite }) {
  const color = PRIORITE_COLORS[priorite] || 'bg-theme-surface text-theme-secondary'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{priorite}</span>
}

export default function MaintenancePredictive() {
  const [actionModal, setActionModal] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['predictions-maintenance'],
    queryFn: getPredictionsMaintenance,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  const predictions = data?.predictions || []
  const hauteCount = predictions.filter(p => p.priorite === 'haute').length
  const moyenneCount = predictions.filter(p => p.priorite === 'moyenne').length
  const basseCount = predictions.filter(p => p.priorite === 'basse').length

  // Regrouper par priorité pour le graphique
  const chartData = [
    { name: 'Haute', value: hauteCount, color: '#F71735' },
    { name: 'Moyenne', value: moyenneCount, color: '#FBB13C' },
    { name: 'Basse', value: basseCount, color: '#20BF55' },
  ].filter(d => d.value > 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Maintenance Prédictive IA4</p>
            <p className="text-sm text-theme-secondary mt-1">Analyse des risques de panne...</p>
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
          <p className="text-xl font-bold text-danger mb-2">Erreur de prédiction</p>
          <p className="text-theme-secondary mb-4">{error?.message}</p>
          <button onClick={() => refetch()} className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all shadow-lg flex items-center gap-2 mx-auto">
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
            <div className="p-2.5 bg-gradient-to-br from-danger/20 to-danger/5 rounded-2xl"><FiSettings className="w-7 h-7 text-danger" /></div>
            <h1 className="text-3xl font-bold text-primary">Maintenance Prédictive</h1>
            <span className="px-2.5 py-1 bg-danger/10 text-danger rounded-full text-xs font-semibold">IA4</span>
          </div>
          <p className="text-theme-secondary ml-1">{predictions.length} prédiction(s) de maintenance — risques de panne analysés par IA</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 text-theme-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-all" title="Actualiser">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiSettings className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Maintenances prévues</p><p className="text-2xl font-bold text-theme-primary">{predictions.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Haute priorité</p><p className="text-2xl font-bold text-danger">{hauteCount}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiClock className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Priorité moyenne</p><p className="text-2xl font-bold text-warning">{moyenneCount}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiCheckCircle className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Priorité basse</p><p className="text-2xl font-bold text-success">{basseCount}</p></div>
          </div>
        </Card>
      </div>

      {/* Priorité Chart */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="glass" className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-danger/20 to-danger/5 rounded-xl"><FiBarChart2 className="w-5 h-5 text-danger" /></div>
              <div><h3 className="text-lg font-bold text-theme-primary">Répartition</h3><p className="text-xs text-theme-secondary">Par niveau de priorité</p></div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
                <Bar dataKey="value" name="Nombre" radius={[0, 8, 8, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={chartData[i].color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Légende */}
          <Card variant="glass" className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-accent" /></div>
              <div><h3 className="text-lg font-bold text-theme-primary">Légende des priorités</h3><p className="text-xs text-theme-secondary">Actions recommandées selon le niveau</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-danger/5 rounded-xl border border-danger/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
                  <span className="font-bold text-danger text-sm">Haute priorité</span>
                </div>
                <p className="text-xs text-theme-secondary">Intervention immédiate requise. Risque de panne critique ou perte de production.</p>
              </div>
              <div className="p-4 bg-warning/5 rounded-xl border border-warning/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="font-bold text-warning text-sm">Priorité moyenne</span>
                </div>
                <p className="text-xs text-theme-secondary">Planifier dans les 7 jours. Surveillance renforcée recommandée.</p>
              </div>
              <div className="p-4 bg-success/5 rounded-xl border border-success/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="font-bold text-success text-sm">Basse priorité</span>
                </div>
                <p className="text-xs text-theme-secondary">Maintenance préventive. Planifier lors du prochain arrêt programmé.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Liste des prédictions */}
      {predictions.length > 0 ? (
        <Card variant="glass" className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-surface border-b border-theme-subtle">
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Bateau</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Type maintenance</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Date estimée</th>
                  <th className="text-center px-4 py-3 font-semibold text-theme-secondary">Priorité</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {predictions.map((p, i) => (
                  <tr key={i} className="hover:bg-theme-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FiAnchor className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold text-theme-primary">{p.nom || `Bateau #${p.bateauId}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">{p.type}</span>
                    </td>
                    <td className="px-4 py-3 text-theme-primary whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5 text-theme-tertiary" />
                        {formatDate(p.dateEstimee)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${PRIORITE_DOTS[p.priorite] || 'bg-gray-400'}`} />
                        <PrioriteBadge priorite={p.priorite} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-theme-secondary max-w-[250px]"><span className="text-xs">{p.raison}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-16">
          <FiCheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucune maintenance prévue</h3>
          <p className="text-theme-tertiary">Tous les bateaux sont en bon état selon l'IA</p>
        </div>
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-danger/10 rounded-xl shrink-0"><FiSettings className="w-5 h-5 text-danger" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos d'IA4</h3>
            <p className="text-sm text-theme-secondary">
              L'analyseur de maintenance prédictive utilise l'IA générative (Google Gemini 1.5 Flash) pour analyser
              l'historique des maintenances et l'état des bateaux. Les prédictions identifient les risques de panne
              et recommandent des actions préventives avec leur niveau de priorité. Les maintenances haute priorité
              nécessitent une intervention immédiate.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
