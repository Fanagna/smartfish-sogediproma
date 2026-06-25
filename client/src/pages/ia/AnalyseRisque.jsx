import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalyseRisques } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FiShield, FiAlertTriangle, FiRefreshCw, FiInfo, FiDollarSign, FiAnchor, FiGlobe, FiBarChart2 } from 'react-icons/fi'

const CHART_COLORS = ['#F71735', '#FBB13C', '#20BF55', '#0B4F6C']
const NIVEAU_COLORS = { faible: 'bg-success/10 text-success', moyenne: 'bg-warning/10 text-warning', élevée: 'bg-danger/10 text-danger', eleve: 'bg-danger/10 text-danger', critique: 'bg-red-500/10 text-red-500' }
const IMPACT_COLORS = { faible: 'bg-theme-surface text-theme-secondary', moyen: 'bg-warning/10 text-warning', élevé: 'bg-danger/10 text-danger', critique: 'bg-red-500/10 text-red-500' }

export default function AnalyseRisque() {
  const [tab, setTab] = useState('financier')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analyse-risques'],
    queryFn: getAnalyseRisques,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  })

  const risquesFinanciers = data?.risquesFinanciers || []
  const risquesOperationnels = data?.risquesOperationnels || []
  const risquesLogistiques = data?.risquesLogistiques || []
  const recommandations = data?.recommandationsGlobales || []

  const allRisks = [...risquesFinanciers, ...risquesOperationnels, ...risquesLogistiques]
  const critiqueCount = allRisks.filter(r => r.impact === 'critique' || r.probabilite === 'élevée' || r.probabilite === 'critique').length

  const chartData = [
    { name: 'Financier', value: risquesFinanciers.length, color: '#0B4F6C' },
    { name: 'Opérationnel', value: risquesOperationnels.length, color: '#FBB13C' },
    { name: 'Logistique', value: risquesLogistiques.length, color: '#F71735' },
  ].filter(d => d.value > 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center"><p className="text-lg font-bold text-theme-primary">Analyse des Risques IA12</p><p className="text-sm text-theme-secondary mt-1">Évaluation des risques en cours...</p></div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <FiInfo className="w-16 h-16 mx-auto text-danger mb-4" />
          <p className="text-xl font-bold text-danger mb-2">Erreur d'analyse</p>
          <p className="text-theme-secondary mb-4">{error?.message}</p>
          <button onClick={() => refetch()} className="px-5 py-2.5 bg-accent text-white rounded-xl"><FiRefreshCw className="w-4 h-4 inline mr-2" />Réessayer</button>
        </div>
      </div>
    )
  }

  const currentRisks = tab === 'financier' ? risquesFinanciers : tab === 'operationnel' ? risquesOperationnels : risquesLogistiques

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-red-500/20 to-purple-500/20 rounded-2xl"><FiShield className="w-7 h-7 text-red-500" /></div>
            <h1 className="text-3xl font-bold text-primary">Analyse des Risques</h1>
            <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-semibold">IA12</span>
          </div>
          <p className="text-theme-secondary ml-1">{allRisks.length} risque(s) identifié(s) — {critiqueCount} critique(s)</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 text-theme-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl"><FiRefreshCw className="w-5 h-5" /></button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiDollarSign className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Risques financiers</p><p className="text-2xl font-bold text-theme-primary">{risquesFinanciers.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiAnchor className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Risques opérationnels</p><p className="text-2xl font-bold text-theme-primary">{risquesOperationnels.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiGlobe className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Risques logistiques</p><p className="text-2xl font-bold text-theme-primary">{risquesLogistiques.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Recommandations</p><p className="text-2xl font-bold text-theme-primary">{recommandations.length}</p></div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="glass" className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-xl"><FiBarChart2 className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="text-lg font-bold text-theme-primary">Répartition</h3><p className="text-xs text-theme-secondary">Par catégorie de risque</p></div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
                <Bar dataKey="value" name="Nombre" radius={[0, 8, 8, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={chartData[i].color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Legend cards */}
          <Card variant="glass" className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-accent" /></div>
              <div><h3 className="text-lg font-bold text-theme-primary">Légende des niveaux</h3><p className="text-xs text-theme-secondary">Probabilité et impact</p></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['faible', 'moyenne', 'élevée', 'critique'].map(n => (
                <div key={n} className={`p-3 rounded-xl text-center text-xs font-semibold ${NIVEAU_COLORS[n] || 'bg-theme-surface text-theme-secondary'}`}>{n}</div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl p-1 w-fit">
        <button onClick={() => setTab('financier')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'financier' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'} flex items-center gap-1`}><FiDollarSign className="w-4 h-4" /> Financier</button>
        <button onClick={() => setTab('operationnel')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'operationnel' ? 'bg-warning text-white shadow-md' : 'text-theme-secondary hover:text-warning'} flex items-center gap-1`}><FiAnchor className="w-4 h-4" /> Opérationnel</button>
        <button onClick={() => setTab('logistique')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'logistique' ? 'bg-danger text-white shadow-md' : 'text-theme-secondary hover:text-danger'} flex items-center gap-1`}><FiGlobe className="w-4 h-4" /> Logistique</button>
      </div>

      {/* Risk cards */}
      {currentRisks.length > 0 ? (
        <div className="space-y-3">
          {currentRisks.map((r, i) => {
            const probaStyle = NIVEAU_COLORS[r.probabilite] || 'bg-theme-surface text-theme-secondary'
            const impactStyle = IMPACT_COLORS[r.impact] || 'bg-theme-surface text-theme-secondary'
            return (
              <Card key={i} variant="glass" className="!p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-danger/5 flex items-center justify-center shrink-0"><FiAlertTriangle className="w-5 h-5 text-danger" /></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-theme-primary text-sm">{r.titre}</h4>
                    <p className="text-xs text-theme-secondary mt-0.5">{r.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${probaStyle}`}>Probabilité: {r.probabilite}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${impactStyle}`}>Impact: {r.impact}</span>
                    </div>
                    {r.recommandation && <p className="text-xs text-accent mt-2"><span className="font-semibold">→</span> {r.recommandation}</p>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-theme-tertiary"><FiShield className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">Aucun risque dans cette catégorie</p></div>
      )}

      {/* Recommandations globales */}
      {recommandations.length > 0 && (
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl"><FiShield className="w-5 h-5 text-accent" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Recommandations Globales</h3><p className="text-xs text-theme-secondary">Pour atténuer les risques identifiés</p></div>
          </div>
          <div className="space-y-3">
            {recommandations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-theme-surface rounded-xl">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-theme-primary">{r}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-red-500/10 rounded-xl shrink-0"><FiShield className="w-5 h-5 text-red-500" /></div>
          <div><h3 className="font-bold text-theme-primary mb-1">À propos d'IA12</h3><p className="text-sm text-theme-secondary">Analyse les risques financiers, opérationnels et logistiques via Gemini 1.5 Flash. Chaque risque inclut probabilité, impact et recommandations d'atténuation.</p></div>
        </div>
      </Card>
    </div>
  )
}
