import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getRuptureStock, getSurstock, getRecommendationStock, getRotationStock, getCritiquesStock } from '../../services/stockService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { FiAlertTriangle, FiTrendingUp, FiShoppingCart, FiDollarSign, FiInfo, FiCpu, FiClock, FiPackage, FiArrowUp, FiArrowDown, FiCheckCircle } from 'react-icons/fi'
import { formatCurrency } from '../../utils/format'
import toast from 'react-hot-toast'

const CHART_COLORS = ['#F71735', '#FBB13C', '#20BF55', '#0B4F6C', '#01BAEF', '#7C3AED', '#EC4899', '#14B8A6']
const URGENCE = { CRITIQUE: { label: 'Critique', color: 'bg-danger/10 text-danger', dot: 'bg-danger animate-pulse' }, HAUTE: { label: 'Haute', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' }, MOYENNE: { label: 'Moyenne', color: 'bg-warning/10 text-warning', dot: 'bg-warning' }, BASSE: { label: 'Basse', color: 'bg-success/10 text-success', dot: 'bg-success' } }
const RENTABILITE = { HAUTE: { label: 'Haute', color: 'bg-success/10 text-success' }, MOYENNE: { label: 'Moyenne', color: 'bg-warning/10 text-warning' }, BASSE: { label: 'Basse', color: 'bg-danger/10 text-danger' } }

const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function StockIntelligence() {
  const [tab, setTab] = useState('rupture')
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  // Rupture data
  const { data: ruptureData, isLoading: loadingRupture, refetch: refetchRupture } = useQuery({
    queryKey: ['stock-rupture'],
    queryFn: getRuptureStock,
    enabled: tab === 'rupture',
    staleTime: 2 * 60 * 1000,
  })

  // Surstock data
  const { data: surstockData, isLoading: loadingSurstock, refetch: refetchSurstock } = useQuery({
    queryKey: ['stock-surstock'],
    queryFn: getSurstock,
    enabled: tab === 'surstock',
    staleTime: 2 * 60 * 1000,
  })

  // Rotation data
  const { data: rotationData, isLoading: loadingRotation } = useQuery({
    queryKey: ['stock-rotation'],
    queryFn: getRotationStock,
    enabled: tab === 'rotation',
    staleTime: 2 * 60 * 1000,
  })

  // Critiques data
  const { data: critiquesData } = useQuery({
    queryKey: ['stock-critiques'],
    queryFn: getCritiquesStock,
    staleTime: 2 * 60 * 1000,
  })

  // Full analysis (recommendation)
  const analyseMutation = useMutation({
    mutationFn: getRecommendationStock,
    onSuccess: () => toast.success('Analyse complète terminée'),
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur d\'analyse'),
  })

  const rupture = ruptureData?.rupture || []
  const surstock = surstockData?.surstock || []
  const rotation = rotationData?.rotation || []
  const critiques = critiquesData || { ruptureImminente: [], surstockDangereux: [], totalCritiques: 0 }
  const reco = analyseMutation.data || {}
  const recommandationsRupture = reco.recommandationsRupture || []
  const recommandationsSurstock = reco.recommandationsSurstock || []
  const recommandationsAchatMassif = reco.recommandationsAchatMassif || []
  const analyseRentabilite = reco.analyseRentabilite || []

  const handleAnalyseComplete = () => {
    setShowFullAnalysis(true)
    analyseMutation.mutate()
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-blue-500/20 rounded-2xl"><FiPackage className="w-7 h-7 text-accent" /></div>
            <h1 className="text-3xl font-bold text-primary">Intelligence Stock</h1>
            <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">IA</span>
          </div>
          <p className="text-theme-secondary ml-1">Analyse intelligente des stocks — ruptures, surstocks, rentabilité et recommandations</p>
        </div>
        <Button onClick={handleAnalyseComplete} disabled={analyseMutation.isPending} className="flex items-center gap-2">
          {analyseMutation.isPending ? <Spinner className="w-4 h-4 border-2 border-white/30 border-t-white" /> : <FiCpu className="w-4 h-4" />}
          {analyseMutation.isPending ? 'Analyse en cours...' : 'Analyse complète IA'}
        </Button>
      </div>

      {/* KPIs critiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Ruptures</p><p className="text-2xl font-bold text-theme-primary">{rupture.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiPackage className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Surstocks</p><p className="text-2xl font-bold text-theme-primary">{surstock.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiTrendingUp className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Rotation FFFO</p><p className="text-2xl font-bold text-theme-primary">{rotation.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiInfo className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Critiques</p><p className="text-2xl font-bold text-danger">{critiques.totalCritiques || 0}</p></div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl p-1 flex-wrap w-fit">
        <button onClick={() => setTab('rupture')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'rupture' ? 'bg-danger text-white shadow-md' : 'text-theme-secondary hover:text-danger'} flex items-center gap-1.5`}>
          <FiAlertTriangle className="w-4 h-4" /> Rupture ({rupture.length})
        </button>
        <button onClick={() => setTab('surstock')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'surstock' ? 'bg-warning text-white shadow-md' : 'text-theme-secondary hover:text-warning'} flex items-center gap-1.5`}>
          <FiPackage className="w-4 h-4" /> Surstock ({surstock.length})
        </button>
        <button onClick={() => setTab('recommandation')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'recommandation' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'} flex items-center gap-1.5`}>
          <FiShoppingCart className="w-4 h-4" /> Recommandation ({recommandationsRupture.length + recommandationsSurstock.length})
        </button>
        <button onClick={() => setTab('rentabilite')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'rentabilite' ? 'bg-success text-white shadow-md' : 'text-theme-secondary hover:text-success'} flex items-center gap-1.5`}>
          <FiDollarSign className="w-4 h-4" /> Rentabilité ({analyseRentabilite.length})
        </button>
        <button onClick={() => setTab('rotation')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'rotation' ? 'bg-primary text-white shadow-md' : 'text-theme-secondary hover:text-primary'} flex items-center gap-1.5`}>
          <FiClock className="w-4 h-4" /> FIFO ({rotation.length})
        </button>
      </div>

      {/* ─── TAB: RUPTURE ─── */}
      {tab === 'rupture' && (
        loadingRupture ? (
          <div className="flex justify-center py-12"><Spinner className="w-10 h-10" /></div>
        ) : rupture.length > 0 ? (
          <div className="space-y-3">
            {rupture.map((r, i) => {
              const urg = URGENCE[r.niveauUrgence] || URGENCE.BASSE
              return (
                <Card key={i} variant="glass" className="!p-4 border-l-4" style={{ borderLeftColor: r.niveauUrgence === 'CRITIQUE' ? '#F71735' : r.niveauUrgence === 'HAUTE' ? '#F97316' : '#FBB13C' }}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${urg.color} flex items-center justify-center shrink-0`}><FiAlertTriangle className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-theme-primary">{r.espece}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${urg.color}`}>{urg.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm mt-2">
                        <span className="text-theme-secondary">Stock: <strong>{formatNumber(r.quantiteActuelle)} {r.unite}</strong></span>
                        <span className="text-theme-secondary">Seuil: <strong>{formatNumber(r.seuil)}</strong></span>
                        <span className="text-theme-secondary">Ventes 30j: <strong>{formatNumber(r.ventes30j)}</strong></span>
                        <span className="text-theme-secondary">Jours restants: <strong className={r.joursRestants <= 3 ? 'text-danger' : 'text-warning'}>{r.joursRestants}j</strong></span>
                      </div>
                      <div className="mt-2 w-full bg-theme-surface rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full ${r.niveauUrgence === 'CRITIQUE' ? 'bg-danger' : 'bg-warning'}`}
                          style={{ width: `${Math.min((r.seuil / r.quantiteActuelle) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-theme-tertiary"><FiCheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50 text-success" /><p className="text-sm">Aucune rupture imminente détectée</p></div>
        )
      )}

      {/* ─── TAB: SURSTOCK ─── */}
      {tab === 'surstock' && (
        loadingSurstock ? (
          <div className="flex justify-center py-12"><Spinner className="w-10 h-10" /></div>
        ) : surstock.length > 0 ? (
          <div className="space-y-3">
            {surstock.map((s, i) => (
              <Card key={i} variant="glass" className="!p-4 border-l-4 border-warning">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0"><FiPackage className="w-5 h-5 text-warning" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-theme-primary mb-1">{s.espece}</h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-theme-secondary">Stock: <strong>{formatNumber(s.quantiteActuelle)} {s.unite}</strong></span>
                      <span className="text-theme-secondary">Ventes 90j: <strong>{formatNumber(s.ventes90j)}</strong></span>
                      <span className="text-theme-secondary">Moy./mois: <strong>{formatNumber(s.moyenneMois)}</strong></span>
                      <span className="text-theme-secondary">Ratio: <strong className="text-warning">{s.ratio}x</strong></span>
                    </div>
                    <p className="text-xs text-theme-secondary mt-2">{s.recommandation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-theme-tertiary"><FiCheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50 text-success" /><p className="text-sm">Aucun surstock détecté</p></div>
        )
      )}

      {/* ─── TAB: RECOMMANDATION ─── */}
      {tab === 'recommandation' && (
        !showFullAnalysis ? (
          <div className="text-center py-16">
            <FiCpu className="w-16 h-16 mx-auto text-theme-muted mb-4" />
            <h3 className="text-xl font-bold text-theme-secondary mb-2">Analyse non lancée</h3>
            <p className="text-theme-tertiary mb-6">Cliquez sur "Analyse complète IA" pour obtenir des recommandations personnalisées</p>
            <Button onClick={handleAnalyseComplete} disabled={analyseMutation.isPending}>
              <FiCpu className="w-4 h-4 mr-2" /> Lancer l'analyse
            </Button>
          </div>
        ) : analyseMutation.isPending ? (
          <Card variant="glass" className="!p-8">
            <div className="flex flex-col items-center gap-4 py-8">
              <Spinner className="w-12 h-12 border-4 border-accent/30 border-t-accent" />
              <p className="text-lg font-bold text-theme-primary">Analyse en cours...</p>
              <p className="text-sm text-theme-secondary">Génération des recommandations par IA</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Recommandations rupture */}
            {recommandationsRupture.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-theme-primary mb-3 flex items-center gap-2"><FiAlertTriangle className="w-5 h-5 text-danger" /> Recommandations Achat (Rupture)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommandationsRupture.map((r, i) => (
                    <Card key={i} variant="glass" className="!p-4 border-danger/20 bg-danger/[0.02]">
                      <div className="flex items-center gap-2 mb-2">
                        <FiArrowUp className="w-4 h-4 text-danger" />
                        <h4 className="font-bold text-theme-primary">{r.espece}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${URGENCE[r.urgence]?.color || 'bg-theme-surface'}`}>{URGENCE[r.urgence]?.label || r.urgence}</span>
                      </div>
                      <p className="text-sm text-theme-primary">Acheter <strong>{formatNumber(r.quantiteRecommandee)}</strong> kg — Priorité {r.priorite}</p>
                      <p className="text-xs text-theme-secondary mt-1">{r.raison}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations surstock */}
            {recommandationsSurstock.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-theme-primary mb-3 flex items-center gap-2"><FiPackage className="w-5 h-5 text-warning" /> Recommandations Surstock</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommandationsSurstock.map((r, i) => (
                    <Card key={i} variant="glass" className="!p-4 border-warning/20 bg-warning/[0.02]">
                      <div className="flex items-center gap-2 mb-2">
                        <FiArrowDown className="w-4 h-4 text-warning" />
                        <h4 className="font-bold text-theme-primary">{r.espece}</h4>
                      </div>
                      <p className="text-sm text-theme-primary"><span className="font-semibold">Action:</span> {r.action}</p>
                      <p className="text-xs text-theme-secondary mt-1">{r.raison}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Achat massif */}
            {recommandationsAchatMassif.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-theme-primary mb-3 flex items-center gap-2"><FiShoppingCart className="w-5 h-5 text-accent" /> Achat Massif Recommandé</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommandationsAchatMassif.map((r, i) => (
                    <Card key={i} variant="glass" className="!p-4 border-accent/20">
                      <h4 className="font-bold text-theme-primary">{r.espece}</h4>
                      <p className="text-sm text-theme-primary">Quantité: <strong>{formatNumber(r.quantiteSuggestionnee)} kg</strong></p>
                      <p className="text-xs text-theme-secondary mt-1">{r.raison}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {recommandationsRupture.length === 0 && recommandationsSurstock.length === 0 && (
              <div className="text-center py-8 text-theme-tertiary"><FiCheckCircle className="w-8 h-8 mx-auto mb-2 text-success" /><p>Aucune recommandation spécifique</p></div>
            )}
          </div>
        )
      )}

      {/* ─── TAB: RENTABILITÉ ─── */}
      {tab === 'rentabilite' && (
        !showFullAnalysis ? (
          <div className="text-center py-16">
            <FiCpu className="w-16 h-16 mx-auto text-theme-muted mb-4" />
            <h3 className="text-xl font-bold text-theme-secondary mb-2">Analyse non lancée</h3>
            <p className="text-theme-tertiary mb-6">Cliquez sur "Analyse complète IA" pour voir la rentabilité par espèce</p>
            <Button onClick={handleAnalyseComplete} disabled={analyseMutation.isPending}>
              <FiCpu className="w-4 h-4 mr-2" /> Lancer l'analyse
            </Button>
          </div>
        ) : analyseRentabilite.length > 0 ? (
          <div className="space-y-6">
            {/* Chart */}
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-success/20 to-success/5 rounded-xl"><FiDollarSign className="w-5 h-5 text-success" /></div>
                <div><h3 className="text-lg font-bold text-theme-primary">CA par Espèce</h3><p className="text-xs text-theme-secondary">30 derniers jours</p></div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analyseRentabilite} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="espece" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={120} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
                  <Bar dataKey="totalCA" name="CA" radius={[0, 8, 8, 0]}>
                    {analyseRentabilite.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analyseRentabilite.map((r, i) => {
                const rent = RENTABILITE[r.rentabilite] || { label: r.rentabilite, color: 'bg-theme-surface text-theme-secondary' }
                return (
                  <Card key={i} variant="glass" className="!p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-theme-primary">{r.espece}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${rent.color}`}>{rent.label}</span>
                    </div>
                    <p className="text-sm text-theme-secondary">CA: <strong className="text-theme-primary">{formatCurrency(r.totalCA)}</strong></p>
                    <p className="text-sm text-theme-secondary">Prix moyen: <strong className="text-theme-primary">{formatCurrency(r.prixMoyenUnitaire)}</strong></p>
                    <p className="text-sm text-theme-secondary">Qté vendue: <strong className="text-theme-primary">{formatNumber(r.totalQuantite)} kg</strong></p>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-theme-tertiary"><FiDollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Aucune donnée de rentabilité</p></div>
        )
      )}

      {/* ─── TAB: ROTATION FIFO ─── */}
      {tab === 'rotation' && (
        loadingRotation ? (
          <div className="flex justify-center py-12"><Spinner className="w-10 h-10" /></div>
        ) : rotation.length > 0 ? (
          <div className="space-y-3">
            {rotation.sort((a, b) => b.ageEnJours - a.ageEnJours).map((r, i) => (
              <Card key={i} variant="glass" className="!p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.priorite === 'HAUTE' ? 'bg-danger/10 text-danger' : r.priorite === 'MOYENNE' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                    <FiClock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-theme-primary">{r.espece}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.priorite === 'HAUTE' ? 'bg-danger/10 text-danger' : r.priorite === 'MOYENNE' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{r.priorite}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-theme-secondary">Stock: <strong>{formatNumber(r.quantite)} kg</strong></span>
                      <span className="text-theme-secondary">Âge: <strong className={r.ageEnJours > 30 ? 'text-danger' : r.ageEnJours > 15 ? 'text-warning' : 'text-success'}>{r.ageEnJours} jours</strong></span>
                      <span className="text-theme-secondary">Entrée: <strong>{formatDate(r.dateEntree)}</strong></span>
                    </div>
                    <p className="text-xs text-theme-secondary mt-1">{r.action}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-theme-tertiary"><FiClock className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Aucune rotation à signaler</p></div>
        )
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-accent/10 rounded-xl shrink-0"><FiPackage className="w-5 h-5 text-accent" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos</h3>
            <p className="text-sm text-theme-secondary">
              L'intelligence stock combine des algorithmes métier (détection de rupture par consommation réelle, analyse FIFO, calcul de rentabilité)
              et l'IA générative Gemini pour produire des recommandations d'achat et de gestion personnalisées.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
