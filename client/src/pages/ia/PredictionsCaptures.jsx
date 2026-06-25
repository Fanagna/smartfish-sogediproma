import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPredictionsCaptures } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { FiTarget, FiTrendingUp, FiCalendar, FiBarChart2, FiDroplet, FiRefreshCw, FiInfo } from 'react-icons/fi'

const CHART_COLORS = ['#0B4F6C', '#01BAEF', '#20BF55', '#FBB13C', '#F71735', '#7C3AED', '#EC4899']

const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)

export default function PredictionsCaptures() {
  const [viewMode, setViewMode] = useState('chart') // chart | table

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['predictions-captures'],
    queryFn: getPredictionsCaptures,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  const predictions = data?.predictionCaptures || []
  const predictionsStocks = data?.predictionStocks || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Prédictions IA3</p>
            <p className="text-sm text-theme-secondary mt-1">Analyse des données en cours...</p>
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
          <p className="text-theme-secondary mb-4">{error?.message || 'Impossible de contacter l\'IA'}</p>
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
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-blue-500/20 rounded-2xl"><FiTarget className="w-7 h-7 text-accent" /></div>
            <h1 className="text-3xl font-bold text-primary">Prédictions de Captures</h1>
            <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">IA3</span>
          </div>
          <p className="text-theme-secondary ml-1">Prévisions intelligentes des espèces capturables dans les 7 prochains jours</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 text-theme-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all" title="Actualiser">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiTarget className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Espèces prévues</p><p className="text-2xl font-bold text-theme-primary">{predictions.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiTrendingUp className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Meilleure chance</p><p className="text-2xl font-bold text-theme-primary">
              {predictions.length > 0 ? `${predictions[0].probabilite || 0}%` : '—'}
            </p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiCalendar className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Période</p><p className="text-2xl font-bold text-theme-primary">7 jours</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl"><FiBarChart2 className="w-5 h-5 text-primary" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Stocks prévus</p><p className="text-2xl font-bold text-theme-primary">{predictionsStocks.length}</p></div>
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl p-1 w-fit">
        <button onClick={() => setViewMode('chart')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'chart' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'}`}>
          <FiBarChart2 className="w-4 h-4 inline mr-1.5" /> Graphiques
        </button>
        <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'}`}>
          <FiDroplet className="w-4 h-4 inline mr-1.5" /> Tableau
        </button>
      </div>

      {viewMode === 'chart' ? (
        <>
          {/* ── Chart Row 1: BarChart + PieChart ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BarChart — Probabilités */}
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiBarChart2 className="w-5 h-5 text-accent" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">Probabilité de Capture</h3><p className="text-xs text-theme-secondary">Top espèces prévues pour les 7 prochains jours</p></div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={predictions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="espece" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={120} />
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="probabilite" name="Probabilité" radius={[0, 8, 8, 0]}>
                    {predictions.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* PieChart — Répartition */}
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-success/20 to-success/5 rounded-xl"><FiBarChart2 className="w-5 h-5 text-success" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">Répartition des Prévisions</h3><p className="text-xs text-theme-secondary">Distribution des espèces probables</p></div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={predictions} cx="50%" cy="50%" labelLine={true}
                    label={({ espece, probabilite }) => `${espece} ${probabilite}%`}
                    outerRadius={110} innerRadius={50} dataKey="probabilite">
                    {predictions.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* ── Stock Predictions ── */}
          {predictionsStocks.length > 0 && (
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl"><FiTrendingUp className="w-5 h-5 text-warning" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">Prédictions des Stocks (14 jours)</h3><p className="text-xs text-theme-secondary">IA3 — Analyse de suffisance des stocks</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictionsStocks.map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${s.statut === 'insuffisant' ? 'border-danger/20 bg-danger/5' : 'border-success/20 bg-success/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-theme-primary">{s.espece}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.statut === 'insuffisant' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        {s.statut === 'insuffisant' ? '⚠ Insuffisant' : '✓ Suffisant'}
                      </span>
                    </div>
                    {s.recommandation && <p className="text-sm text-theme-secondary">{s.recommandation}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        /* ── Table View ── */
        <Card variant="glass" className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-surface border-b border-theme-subtle">
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Espèce</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-secondary">Probabilité</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Barre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {predictions.map((p, i) => (
                  <tr key={i} className="hover:bg-theme-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="font-semibold text-theme-primary">{p.espece}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-theme-primary">{p.probabilite}%</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-theme-surface rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.probabilite || 0}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Info Card ── */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-accent/10 rounded-xl shrink-0"><FiTarget className="w-5 h-5 text-accent" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos d'IA3</h3>
            <p className="text-sm text-theme-secondary">
              L'analyseur de prédictions de captures utilise l'IA générative (Google Gemini 1.5 Flash) pour analyser
              les données historiques de captures et les stocks actuels. Les prédictions sont basées sur les tendances
              observées et les corrélations entre espèces. Les résultats sont mis à jour périodiquement.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
