import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPredictionsVentes } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts'
import { FiTrendingUp, FiDollarSign, FiBarChart2, FiActivity, FiRefreshCw, FiInfo, FiArrowUp, FiArrowDown, FiMinus, FiShoppingCart } from 'react-icons/fi'
import { formatCurrency } from '../../utils/format'

const CHART_COLORS = ['#0B4F6C', '#01BAEF', '#20BF55', '#FBB13C', '#F71735', '#7C3AED', '#EC4899', '#14B8A6', '#6366F1', '#F97316']

const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)

function TrendIcon({ trend, size = 'w-4 h-4' }) {
  if (trend === 'hausse') return <FiArrowUp className={`${size} text-success`} />
  if (trend === 'baisse') return <FiArrowDown className={`${size} text-danger`} />
  return <FiMinus className={`${size} text-theme-tertiary`} />
}

export default function PrixMarche() {
  const [selectedTab, setSelectedTab] = useState('all')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['predictions-ventes'],
    queryFn: getPredictionsVentes,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  const predictions = data?.predictionVentes || []
  const recommandations = data?.recommandationsGenerales || []

  // Filtrer par tendance
  const filteredPredictions = selectedTab === 'all' ? predictions
    : predictions.filter(p => p.tendance === selectedTab)

  // Stats
  const totalCA = predictions.reduce((s, p) => s + (p.caEstime || 0), 0)
  const totalQte = predictions.reduce((s, p) => s + (p.quantiteEstimee || 0), 0)
  const hausseCount = predictions.filter(p => p.tendance === 'hausse').length
  const baisseCount = predictions.filter(p => p.tendance === 'baisse').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Prévisions de Prix IA11</p>
            <p className="text-sm text-theme-secondary mt-1">Analyse des tendances du marché...</p>
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
          <p className="text-xl font-bold text-danger mb-2">Erreur de prévisions</p>
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
            <div className="p-2.5 bg-gradient-to-br from-warning/20 to-orange-500/20 rounded-2xl"><FiTrendingUp className="w-7 h-7 text-warning" /></div>
            <h1 className="text-3xl font-bold text-primary">Prix du Marché</h1>
            <span className="px-2.5 py-1 bg-warning/10 text-warning rounded-full text-xs font-semibold">IA11</span>
          </div>
          <p className="text-theme-secondary ml-1">Prévisions de prix et tendances du marché pour les 30 prochains jours</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 text-theme-secondary hover:text-warning hover:bg-warning/10 rounded-xl transition-all" title="Actualiser">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiDollarSign className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">CA Estimé 30j</p><p className="text-xl font-bold text-theme-primary">{formatCurrency(totalCA)}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiShoppingCart className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Quantité prévue</p><p className="text-xl font-bold text-theme-primary">{formatNumber(totalQte)} kg</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiArrowUp className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">En hausse</p><p className="text-xl font-bold text-success">{hausseCount} espèces</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiArrowDown className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">En baisse</p><p className="text-xl font-bold text-danger">{baisseCount} espèces</p></div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl p-1 w-fit">
        <button onClick={() => setSelectedTab('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTab === 'all' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'}`}>
          Toutes ({predictions.length})
        </button>
        <button onClick={() => setSelectedTab('hausse')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTab === 'hausse' ? 'bg-success text-white shadow-md' : 'text-theme-secondary hover:text-success'} flex items-center gap-1`}>
          <FiArrowUp className="w-3.5 h-3.5" /> Hausse ({hausseCount})
        </button>
        <button onClick={() => setSelectedTab('baisse')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTab === 'baisse' ? 'bg-danger text-white shadow-md' : 'text-theme-secondary hover:text-danger'} flex items-center gap-1`}>
          <FiArrowDown className="w-3.5 h-3.5" /> Baisse ({baisseCount})
        </button>
        <button onClick={() => setSelectedTab('stable')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTab === 'stable' ? 'bg-theme-surface0 text-white shadow-md' : 'text-theme-secondary hover:text-theme-primary'} flex items-center gap-1`}>
          <FiMinus className="w-3.5 h-3.5" /> Stable
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA Estimé par espèce */}
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl"><FiBarChart2 className="w-5 h-5 text-warning" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">CA Estimé par Espèce</h3><p className="text-xs text-theme-secondary">Prévisions sur 30 jours</p></div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filteredPredictions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="espece" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={120} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
              <Bar dataKey="caEstime" name="CA Estimé" radius={[0, 8, 8, 0]}>
                {filteredPredictions.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Quantités estimées */}
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiActivity className="w-5 h-5 text-accent" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Quantités Estimées par Espèce</h3><p className="text-xs text-theme-secondary">Volume prévu sur 30 jours (kg)</p></div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filteredPredictions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `${formatNumber(v)}`} />
              <YAxis type="category" dataKey="espece" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={120} />
              <Tooltip formatter={(v) => `${formatNumber(v)} kg`} contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
              <Bar dataKey="quantiteEstimee" name="Quantité" radius={[0, 8, 8, 0]} fill="#01BAEF">
                {filteredPredictions.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Détail des prévisions */}
      <Card variant="glass">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-success/20 to-success/5 rounded-xl"><FiTrendingUp className="w-5 h-5 text-success" /></div>
          <div><h3 className="text-lg font-bold text-theme-primary">Détail des Prévisions</h3><p className="text-xs text-theme-secondary">Analyse complète espèce par espèce</p></div>
        </div>
        {filteredPredictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-surface border-b border-theme-subtle">
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Espèce</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-secondary">Qté estimée</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-secondary">CA estimé</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Tendance</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Recommandation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPredictions.map((p, i) => (
                  <tr key={i} className="hover:bg-theme-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 font-semibold rounded-full text-xs" style={{
                        backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}20`,
                        color: CHART_COLORS[i % CHART_COLORS.length]
                      }}>{p.espece}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-theme-primary">{formatNumber(p.quantiteEstimee)} kg</td>
                    <td className="px-4 py-3 text-right font-bold text-theme-primary">{formatCurrency(p.caEstime)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <TrendIcon trend={p.tendance} />
                        <span className={`text-xs font-semibold ${
                          p.tendance === 'hausse' ? 'text-success' : p.tendance === 'baisse' ? 'text-danger' : 'text-theme-secondary'
                        }`}>{p.tendance}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-theme-secondary max-w-[250px]"><span className="text-xs">{p.recommandation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-theme-tertiary">
            <FiTrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune prévision disponible pour ce filtre</p>
          </div>
        )}
      </Card>

      {/* Recommandations générales */}
      {recommandations.length > 0 && (
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiActivity className="w-5 h-5 text-accent" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Recommandations Générales</h3><p className="text-xs text-theme-secondary">Conseils pour optimiser les ventes</p></div>
          </div>
          <div className="space-y-3">
            {recommandations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-theme-surface rounded-xl">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-theme-primary">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-warning/10 rounded-xl shrink-0"><FiTrendingUp className="w-5 h-5 text-warning" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos d'IA11</h3>
            <p className="text-sm text-theme-secondary">
              L'analyseur de prix du marché utilise l'IA générative (Google Gemini 1.5 Flash) pour analyser
              les ventes passées et les stocks actuels. Les prévisions incluent les quantités estimées,
              le chiffre d'affaires attendu, les tendances (hausse/baisse/stable) et des recommandations
              personnalisées pour optimiser les ventes sur les 30 prochains jours.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
