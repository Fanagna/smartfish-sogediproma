import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPredictionsVentes } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, AreaChart, Area } from 'recharts'
import { FiTrendingUp, FiDollarSign, FiBarChart2, FiShoppingCart, FiRefreshCw, FiInfo, FiArrowUp, FiArrowDown, FiMinus, FiCalendar } from 'react-icons/fi'
import { formatCurrency } from '../../utils/format'

const CHART_COLORS = ['#0B4F6C', '#01BAEF', '#20BF55', '#FBB13C', '#F71735', '#7C3AED', '#EC4899', '#14B8A6', '#6366F1', '#F97316']

const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)

function TrendIcon({ trend }) {
  if (trend === 'hausse') return <FiArrowUp className="w-4 h-4 text-success" />
  if (trend === 'baisse') return <FiArrowDown className="w-4 h-4 text-danger" />
  return <FiMinus className="w-4 h-4 text-theme-tertiary" />
}

export default function PrevisionVentes() {
  const [tab, setTab] = useState('globale')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['predictions-ventes-ia5'],
    queryFn: getPredictionsVentes,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  const predictions = data?.predictionVentes || []
  const recommandations = data?.recommandationsGenerales || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Prévisions Ventes IA5</p>
            <p className="text-sm text-theme-secondary mt-1">Analyse de la demande future...</p>
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

  const totalCA = predictions.reduce((s, p) => s + (p.caEstime || 0), 0)
  const totalQte = predictions.reduce((s, p) => s + (p.quantiteEstimee || 0), 0)
  const hausseCount = predictions.filter(p => p.tendance === 'hausse').length
  const baisseCount = predictions.filter(p => p.tendance === 'baisse').length

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-blue-500/20 rounded-2xl"><FiTrendingUp className="w-7 h-7 text-accent" /></div>
            <h1 className="text-3xl font-bold text-primary">Prévisions Ventes</h1>
            <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">IA5</span>
          </div>
          <p className="text-theme-secondary ml-1">Analyse de la demande future — {predictions.length} espèces analysées</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 text-theme-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all" title="Actualiser">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiDollarSign className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">CA estimé 30j</p><p className="text-xl font-bold text-theme-primary">{formatCurrency(totalCA)}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl"><FiShoppingCart className="w-5 h-5 text-primary" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Volume prévu</p><p className="text-xl font-bold text-theme-primary">{formatNumber(totalQte)} kg</p></div>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl p-1 w-fit">
        <button onClick={() => setTab('globale')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'globale' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'}`}>
          <FiBarChart2 className="w-4 h-4 inline mr-1.5" /> Vue globale
        </button>
        <button onClick={() => setTab('detail')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'detail' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'}`}>
          <FiShoppingCart className="w-4 h-4 inline mr-1.5" /> Détail par espèce
        </button>
      </div>

      {tab === 'globale' ? (
        <>
          {/* Row 1: CA + Qté */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiDollarSign className="w-5 h-5 text-accent" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">CA Estimé par Espèce</h3><p className="text-xs text-theme-secondary">Prévisions des 30 prochains jours</p></div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={predictions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="espece" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={120} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
                  <Bar dataKey="caEstime" name="CA estimé" radius={[0, 8, 8, 0]}>
                    {predictions.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl"><FiShoppingCart className="w-5 h-5 text-primary" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">Volume par Espèce</h3><p className="text-xs text-theme-secondary">Quantité estimée en kg</p></div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={predictions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <YAxis type="category" dataKey="espece" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={120} />
                  <Tooltip formatter={(v) => `${formatNumber(v)} kg`} contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
                  <Bar dataKey="quantiteEstimee" name="Quantité" radius={[0, 8, 8, 0]}>
                    {predictions.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* PieChart — Tendance */}
          <Card variant="glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-success/20 to-success/5 rounded-xl"><FiTrendingUp className="w-5 h-5 text-success" /></div>
              <div><h3 className="text-lg font-bold text-theme-primary">Répartition des Tendances</h3><p className="text-xs text-theme-secondary">Hausse / Stable / Baisse par espèce</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {predictions.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-theme-surface rounded-xl">
                  <TrendIcon trend={p.tendance} />
                  <div className="flex-1">
                    <p className="font-semibold text-theme-primary text-sm">{p.espece}</p>
                    <p className="text-xs text-theme-secondary">{formatCurrency(p.caEstime)} — {formatNumber(p.quantiteEstimee)} kg</p>
                  </div>
                  <span className={`text-xs font-semibold ${p.tendance === 'hausse' ? 'text-success' : p.tendance === 'baisse' ? 'text-danger' : 'text-theme-secondary'}`}>{p.tendance}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        /* ─── Détail par espèce ─── */
        <Card variant="glass" className="overflow-hidden !p-0">
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
                {predictions.map((p, i) => (
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
                        <span className={`text-xs font-semibold ${p.tendance === 'hausse' ? 'text-success' : p.tendance === 'baisse' ? 'text-danger' : 'text-theme-secondary'}`}>{p.tendance}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-theme-secondary max-w-[250px]"><span className="text-xs">{p.recommandation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recommandations */}
      {recommandations.length > 0 && (
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiCalendar className="w-5 h-5 text-accent" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Recommandations pour les 30 jours</h3><p className="text-xs text-theme-secondary">Optimisation des ventes par IA5</p></div>
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
          <div className="p-2.5 bg-accent/10 rounded-xl shrink-0"><FiTrendingUp className="w-5 h-5 text-accent" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos d'IA5</h3>
            <p className="text-sm text-theme-secondary">
              L'analyseur de prévisions de ventes utilise l'IA générative (Google Gemini 1.5 Flash) pour analyser
              les ventes passées et les stocks actuels. Les prévisions incluent les quantités estimées par espèce,
              le chiffre d'affaires attendu, les tendances (hausse/baisse/stable) et des recommandations
              personnalisées pour optimiser les ventes sur les 30 prochains jours.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
