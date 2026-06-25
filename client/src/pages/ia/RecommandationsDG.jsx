import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRecommandationsStrategiques } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { FiTarget, FiTrendingUp, FiBarChart2, FiGlobe, FiRefreshCw, FiInfo, FiStar, FiCalendar, FiDollarSign, FiShield } from 'react-icons/fi'

const IMPACT_COLORS = {
  faible: { bg: 'bg-theme-surface', text: 'text-theme-secondary', dot: 'bg-gray-400' },
  moyen: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  élevé: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
}
const DELAI_COLORS = {
  court: { bg: 'bg-success/10 text-success', label: 'Court terme (≤ 3 mois)' },
  moyen: { bg: 'bg-warning/10 text-warning', label: 'Moyen terme (3-6 mois)' },
  long: { bg: 'bg-accent/10 text-accent', label: 'Long terme (6-12 mois)' },
}
const PROBA_COLORS = {
  faible: 'bg-theme-surface text-theme-secondary',
  moyenne: 'bg-warning/10 text-warning',
  élevée: 'bg-danger/10 text-danger',
}

export default function RecommandationsDG() {
  const [filterImpact, setFilterImpact] = useState('all')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recommandations-dg'],
    queryFn: getRecommandationsStrategiques,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  })

  const recommandations = data?.recommandationsStrategiques || []
  const scenarios = data?.scenariosFuturs || []
  const prioritesDG = data?.prioritesDG || []

  const filteredRecos = filterImpact === 'all'
    ? recommandations
    : recommandations.filter(r => r.impact === filterImpact)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Recommandations Stratégiques IA14</p>
            <p className="text-sm text-theme-secondary mt-1">Analyse des données pour le Directeur Général...</p>
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
          <p className="text-xl font-bold text-danger mb-2">Erreur de recommandations</p>
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
            <div className="p-2.5 bg-gradient-to-br from-danger/20 to-purple-500/20 rounded-2xl"><FiTarget className="w-7 h-7 text-danger" /></div>
            <h1 className="text-3xl font-bold text-primary">Recommandations Stratégiques</h1>
            <span className="px-2.5 py-1 bg-danger/10 text-danger rounded-full text-xs font-semibold">IA14</span>
          </div>
          <p className="text-theme-secondary ml-1">Analyse long terme pour le Directeur Général — 3-12 mois</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 text-theme-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-all" title="Actualiser">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiStar className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Recommandations</p><p className="text-2xl font-bold text-theme-primary">{recommandations.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiBarChart2 className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Impact élevé</p><p className="text-2xl font-bold text-warning">{recommandations.filter(r => r.impact === 'élevé').length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiGlobe className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Scénarios futurs</p><p className="text-2xl font-bold text-theme-primary">{scenarios.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl"><FiTrendingUp className="w-5 h-5 text-primary" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Priorités DG</p><p className="text-2xl font-bold text-theme-primary">{prioritesDG.length}</p></div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl p-1 w-fit">
        <button onClick={() => setFilterImpact('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterImpact === 'all' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'}`}>Toutes</button>
        <button onClick={() => setFilterImpact('élevé')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterImpact === 'élevé' ? 'bg-danger text-white shadow-md' : 'text-theme-secondary hover:text-danger'}`}>Impact élevé</button>
        <button onClick={() => setFilterImpact('moyen')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterImpact === 'moyen' ? 'bg-warning text-white shadow-md' : 'text-theme-secondary hover:text-warning'}`}>Impact moyen</button>
        <button onClick={() => setFilterImpact('faible')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterImpact === 'faible' ? 'bg-theme-surface0 text-white shadow-md' : 'text-theme-secondary hover:text-theme-secondary'}`}>Impact faible</button>
      </div>

      {/* Recommandations cards */}
      {filteredRecos.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecos.map((r, i) => {
            const impactStyle = IMPACT_COLORS[r.impact] || IMPACT_COLORS.faible
            const delaiStyle = DELAI_COLORS[r.delai] || { bg: 'bg-theme-surface text-theme-secondary', label: r.delai }
            return (
              <Card key={i} variant="glass" className="!p-5 hover:-translate-y-1 hover:shadow-xl transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${impactStyle.bg} flex items-center justify-center shrink-0`}>
                    <FiTarget className={`w-6 h-6 ${impactStyle.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-theme-primary text-lg group-hover:text-primary transition-colors">{r.titre}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${impactStyle.bg} ${impactStyle.text}`}>
                        {r.impact}
                      </span>
                    </div>
                    <p className="text-sm text-theme-primary mb-3">{r.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={`px-2.5 py-1 rounded-full font-semibold ${delaiStyle.bg}`}>
                        <FiCalendar className="w-3 h-3 inline mr-1" />{delaiStyle.label}
                      </span>
                      {r.coutEstime && (
                        <span className="px-2.5 py-1 bg-theme-surface text-theme-secondary rounded-full font-semibold">
                          <FiDollarSign className="w-3 h-3 inline mr-0.5" />{r.coutEstime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-theme-tertiary">
          <FiTarget className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune recommandation pour ce filtre</p>
        </div>
      )}

      {/* Scénarios futurs */}
      {scenarios.length > 0 && (
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-xl"><FiGlobe className="w-5 h-5 text-accent" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Scénarios Futurs</h3><p className="text-xs text-theme-secondary">Projections stratégiques à long terme</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((s, i) => (
              <div key={i} className="p-4 rounded-xl border border-theme-subtle bg-theme-surface/50">
                <div className="flex items-center gap-2 mb-2">
                  <FiStar className="w-4 h-4 text-accent" />
                  <h4 className="font-bold text-theme-primary text-sm">{s.titre}</h4>
                </div>
                <p className="text-xs text-theme-secondary mb-3">{s.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PROBA_COLORS[s.probabilite] || 'bg-theme-surface text-theme-secondary'}`}>
                    {s.probabilite}
                  </span>
                  <span className="text-[10px] text-theme-tertiary">{s.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Priorités DG */}
      {prioritesDG.length > 0 && (
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-danger/20 to-danger/5 rounded-xl"><FiShield className="w-5 h-5 text-danger" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Priorités pour le DG</h3><p className="text-xs text-theme-secondary">Actions immédiates recommandées</p></div>
          </div>
          <div className="space-y-3">
            {prioritesDG.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-theme-surface rounded-xl">
                <div className="w-7 h-7 rounded-full bg-danger/10 flex items-center justify-center text-danger font-bold text-xs shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-theme-primary">{p}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-danger/10 rounded-xl shrink-0"><FiTarget className="w-5 h-5 text-danger" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos d'IA14</h3>
            <p className="text-sm text-theme-secondary">
              L'analyseur stratégique utilise l'IA générative (Google Gemini 1.5 Flash) pour produire des
              recommandations à long terme (3-12 mois) destinées au Directeur Général. Il analyse l'ensemble
              des données SmartFish pour proposer des axes de développement, une expansion géographique,
              une diversification des espèces et une optimisation financière.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
