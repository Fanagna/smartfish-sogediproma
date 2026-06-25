import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPredictionsExport } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts'
import { FiGlobe, FiTrendingUp, FiDollarSign, FiBarChart2, FiMapPin, FiRefreshCw, FiInfo, FiNavigation, FiCheckCircle, FiPackage } from 'react-icons/fi'
import { formatCurrency } from '../../utils/format'

const CHART_COLORS = ['#0B4F6C', '#01BAEF', '#20BF55', '#FBB13C', '#F71735', '#7C3AED', '#EC4899', '#14B8A6', '#6366F1', '#F97316']

const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function PrevisionExport() {
  const [tab, setTab] = useState('global')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['predictions-export-ia6'],
    queryFn: getPredictionsExport,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  const predictions = data?.predictionExportations || []
  const recommandations = data?.recommandationsGenerales || []

  // Grouper par pays
  const paysMap = {}
  predictions.forEach(p => {
    if (!paysMap[p.paysDestination]) paysMap[p.paysDestination] = { pays: p.paysDestination, quantite: 0, opportunites: 0 }
    paysMap[p.paysDestination].quantite += p.quantiteEstimee || 0
    if (p.opportunite) paysMap[p.paysDestination].opportunites += 1
  })
  const parPays = Object.values(paysMap).sort((a, b) => b.quantite - a.quantite)

  // Opportunités
  const opportunites = predictions.filter(p => p.opportunite)
  const paysPrometteurs = [...new Set(opportunites.map(p => p.paysDestination))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Prévisions Export IA6</p>
            <p className="text-sm text-theme-secondary mt-1">Analyse des marchés prometteurs...</p>
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

  const totalQte = predictions.reduce((s, p) => s + (p.quantiteEstimee || 0), 0)
  const nbPays = new Set(predictions.map(p => p.paysDestination)).size
  const nbEspeces = new Set(predictions.map(p => p.espece)).size

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-green-500/20 rounded-2xl"><FiGlobe className="w-7 h-7 text-accent" /></div>
            <h1 className="text-3xl font-bold text-primary">Prévisions Export</h1>
            <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">IA6</span>
          </div>
          <p className="text-theme-secondary ml-1">Marchés prometteurs — {predictions.length} prévisions d'exportation analysées</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 text-theme-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all" title="Actualiser">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiGlobe className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Prévisions</p><p className="text-2xl font-bold text-theme-primary">{predictions.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiNavigation className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Pays ciblés</p><p className="text-2xl font-bold text-success">{nbPays}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl"><FiPackage className="w-5 h-5 text-primary" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Espèces</p><p className="text-2xl font-bold text-theme-primary">{nbEspeces}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiTrendingUp className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Opportunités</p><p className="text-2xl font-bold text-warning">{opportunites.length}</p></div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl p-1 w-fit">
        <button onClick={() => setTab('global')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'global' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'}`}>
          <FiBarChart2 className="w-4 h-4 inline mr-1.5" /> Vue globale
        </button>
        <button onClick={() => setTab('marches')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'marches' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'}`}>
          <FiMapPin className="w-4 h-4 inline mr-1.5" /> Marchés prometteurs
        </button>
      </div>

      {tab === 'global' ? (
        <>
          {/* Row 1: Par pays + Par espèce */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiGlobe className="w-5 h-5 text-accent" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">Quantité par Pays</h3><p className="text-xs text-theme-secondary">Prévisions export 30j</p></div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={parPays} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <YAxis type="category" dataKey="pays" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={130} />
                  <Tooltip formatter={(v) => `${formatNumber(v)} kg`} contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
                  <Bar dataKey="quantite" name="Quantité (kg)" radius={[0, 8, 8, 0]}>
                    {parPays.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-success/20 to-success/5 rounded-xl"><FiPackage className="w-5 h-5 text-success" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">Répartition par Espèce</h3><p className="text-xs text-theme-secondary">Produits à exporter</p></div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={predictions} cx="50%" cy="50%" labelLine={true}
                    label={({ espece, quantiteEstimee }) => `${espece} ${formatNumber(quantiteEstimee)}kg`}
                    outerRadius={110} innerRadius={50} dataKey="quantiteEstimee">
                    {predictions.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${formatNumber(v)} kg`} contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Tableau */}
          <Card variant="glass" className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-theme-surface border-b border-theme-subtle">
                    <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Espèce</th>
                    <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Pays</th>
                    <th className="text-right px-4 py-3 font-semibold text-theme-secondary">Qté estimée</th>
                    <th className="text-left px-4 py-3 font-semibold text-theme-secondary">Opportunité</th>
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
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-theme-primary">
                          <FiMapPin className="w-3 h-3 text-accent" /> {p.paysDestination}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-theme-primary">{formatNumber(p.quantiteEstimee)} kg</td>
                      <td className="px-4 py-3">
                        {p.opportunite ? (
                          <span className="flex items-center gap-1 text-success font-semibold text-xs">
                            <FiCheckCircle className="w-3.5 h-3.5" /> Opportunité
                          </span>
                        ) : (
                          <span className="text-theme-tertiary text-xs">Standard</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-theme-secondary max-w-[200px]"><span className="text-xs">{p.recommandation}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        /* ─── Marchés prometteurs ─── */
        <>
          {/* Pays prometteurs */}
          <Card variant="glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-success/20 to-success/5 rounded-xl"><FiNavigation className="w-5 h-5 text-success" /></div>
              <div><h3 className="text-lg font-bold text-theme-primary">Pays avec Opportunités</h3><p className="text-xs text-theme-secondary">Marchés identifiés comme prometteurs</p></div>
            </div>
            {paysPrometteurs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paysPrometteurs.map((pays, i) => {
                  const opportunitesPays = opportunites.filter(o => o.paysDestination === pays)
                  const totalQtePays = opportunitesPays.reduce((s, o) => s + (o.quantiteEstimee || 0), 0)
                  return (
                    <Card key={i} variant="glass" className="!p-5 border-success/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                          <FiGlobe className="w-5 h-5 text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-theme-primary">{pays}</h4>
                          <p className="text-xs text-theme-secondary mt-0.5">{opportunitesPays.length} opportunité(s) — {formatNumber(totalQtePays)} kg prévus</p>
                          <div className="mt-3 space-y-2">
                            {opportunitesPays.map((o, j) => (
                              <div key={j} className="p-2.5 bg-success/5 rounded-lg border border-success/10">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold text-theme-primary">{o.espece}</span>
                                  <span className="text-xs font-bold text-success">{formatNumber(o.quantiteEstimee)} kg</span>
                                </div>
                                <p className="text-[11px] text-theme-secondary">{o.recommandation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-theme-tertiary">
                <FiGlobe className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune opportunité identifiée pour le moment</p>
              </div>
            )}
          </Card>

          {/* Recommandations générales */}
          {recommandations.length > 0 && (
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiTrendingUp className="w-5 h-5 text-accent" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">Recommandations Export</h3><p className="text-xs text-theme-secondary">Conseils pour développer les exportations</p></div>
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
        </>
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-accent/10 rounded-xl shrink-0"><FiGlobe className="w-5 h-5 text-accent" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos d'IA6</h3>
            <p className="text-sm text-theme-secondary">
              L'analyseur de prévisions d'exportation utilise l'IA générative (Google Gemini 1.5 Flash) pour analyser
              les exportations passées et les stocks actuels. Il identifie les marchés prometteurs, les espèces
              à fort potentiel et recommande les pays de destination stratégiques pour les 30 prochains jours.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
