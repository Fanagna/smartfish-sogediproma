import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOptimisationFlotte } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { FiAnchor, FiMapPin, FiUsers, FiDroplet, FiRefreshCw, FiInfo, FiStar, FiTrendingUp, FiNavigation } from 'react-icons/fi'

const PRIORITE_COLORS = {
  1: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20', label: 'Priorité 1' },
  2: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', label: 'Priorité 2' },
  3: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', label: 'Priorité 3' },
  4: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', label: 'Priorité 4' },
  5: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', label: 'Priorité 5' },
}

export default function OptimisationFlotte() {
  const [tab, setTab] = useState('bateaux')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['optimisation-flotte'],
    queryFn: getOptimisationFlotte,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  })

  const priorisation = data?.priorisationBateaux || []
  const repartitionZones = data?.repartitionZones || []
  const conseilsEquipages = data?.conseilsEquipages || []
  const recommandationsCarburant = data?.recommandationsCarburant || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-14 h-14 border-4 border-accent/30 border-t-accent" />
          <div className="text-center">
            <p className="text-lg font-bold text-theme-primary">Optimisation Flotte IA8</p>
            <p className="text-sm text-theme-secondary mt-1">Analyse des données opérationnelles...</p>
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
          <p className="text-xl font-bold text-danger mb-2">Erreur d'optimisation</p>
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
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-2xl"><FiNavigation className="w-7 h-7 text-primary" /></div>
            <h1 className="text-3xl font-bold text-primary">Optimisation Flotte</h1>
            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">IA8</span>
          </div>
          <p className="text-theme-secondary ml-1">Recommandations prioritaires — choix des bateaux, zones, équipages et carburant</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 text-theme-secondary hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Actualiser">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl"><FiAnchor className="w-5 h-5 text-primary" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Bateaux analysés</p><p className="text-2xl font-bold text-theme-primary">{priorisation.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiMapPin className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Zones proposées</p><p className="text-2xl font-bold text-theme-primary">{repartitionZones.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiUsers className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Conseils équipage</p><p className="text-2xl font-bold text-theme-primary">{conseilsEquipages.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiDroplet className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Conseils carburant</p><p className="text-2xl font-bold text-theme-primary">{recommandationsCarburant.length}</p></div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl p-1 w-fit flex-wrap">
        <button onClick={() => setTab('bateaux')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'bateaux' ? 'bg-primary text-white shadow-md' : 'text-theme-secondary hover:text-primary'} flex items-center gap-1.5`}>
          <FiAnchor className="w-4 h-4" /> Bateaux
        </button>
        <button onClick={() => setTab('zones')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'zones' ? 'bg-accent text-white shadow-md' : 'text-theme-secondary hover:text-accent'} flex items-center gap-1.5`}>
          <FiMapPin className="w-4 h-4" /> Zones
        </button>
        <button onClick={() => setTab('equipage')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'equipage' ? 'bg-warning text-white shadow-md' : 'text-theme-secondary hover:text-warning'} flex items-center gap-1.5`}>
          <FiUsers className="w-4 h-4" /> Équipage
        </button>
        <button onClick={() => setTab('carburant')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'carburant' ? 'bg-success text-white shadow-md' : 'text-theme-secondary hover:text-success'} flex items-center gap-1.5`}>
          <FiDroplet className="w-4 h-4" /> Carburant
        </button>
      </div>

      {/* ─── BATEAUX ─── */}
      {tab === 'bateaux' && (
        <div className="space-y-4">
          {priorisation.length > 0 ? (
            priorisation.sort((a, b) => (a.priorite || 99) - (b.priorite || 99)).map((b, i) => {
              const style = PRIORITE_COLORS[b.priorite] || PRIORITE_COLORS[5]
              return (
                <Card key={i} variant="glass" className={`!p-5 border-l-4 ${style.border}`} style={{ borderLeftColor: b.priorite <= 2 ? '#F71735' : b.priorite <= 3 ? '#FBB13C' : '#20BF55' }}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                      <FiAnchor className={`w-6 h-6 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-theme-primary text-lg">{b.nom || `Bateau #${b.bateauId}`}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-sm text-theme-primary">{b.recommandation}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map(p => (
                        <FiStar key={p} className={`w-4 h-4 ${p <= (6 - (b.priorite || 5)) ? 'text-warning fill-current' : 'text-theme-muted'}`} />
                      ))}
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-12 text-theme-tertiary"><FiAnchor className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Aucune recommandation disponible</p></div>
          )}
        </div>
      )}

      {/* ─── ZONES ─── */}
      {tab === 'zones' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {repartitionZones.length > 0 ? (
            repartitionZones.map((z, i) => (
              <Card key={i} variant="glass" className="!p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <FiNavigation className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-theme-primary">{z.nom || `Bateau #${z.bateauId}`}</h4>
                      <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-[10px] font-semibold">{z.zonePeche}</span>
                    </div>
                    <p className="text-sm text-theme-secondary"><span className="font-semibold">Espèce cible :</span> {z.especeCible}</p>
                    <p className="text-xs text-theme-secondary mt-1">{z.justification}</p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 text-theme-tertiary"><FiMapPin className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Aucune répartition de zone proposée</p></div>
          )}
        </div>
      )}

      {/* ─── ÉQUIPAGE ─── */}
      {tab === 'equipage' && (
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl"><FiUsers className="w-5 h-5 text-warning" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Conseils Équipage</h3><p className="text-xs text-theme-secondary">Recommandations pour la gestion des équipages</p></div>
          </div>
          {conseilsEquipages.length > 0 ? (
            <div className="space-y-3">
              {conseilsEquipages.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-theme-surface rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-warning/10 flex items-center justify-center text-warning font-bold text-xs shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-theme-primary">{c}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-theme-tertiary"><FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Aucun conseil disponible</p></div>
          )}
        </Card>
      )}

      {/* ─── CARBURANT ─── */}
      {tab === 'carburant' && (
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-success/20 to-green-500/5 rounded-xl"><FiDroplet className="w-5 h-5 text-success" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Recommandations Carburant</h3><p className="text-xs text-theme-secondary">Optimisation de la consommation et des coûts</p></div>
          </div>
          {recommandationsCarburant.length > 0 ? (
            <div className="space-y-3">
              {recommandationsCarburant.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-theme-surface rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center text-success font-bold text-xs shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-theme-primary">{r}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-theme-tertiary"><FiDroplet className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Aucune recommandation disponible</p></div>
          )}
        </Card>
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-primary/10 rounded-xl shrink-0"><FiNavigation className="w-5 h-5 text-primary" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos d'IA8</h3>
            <p className="text-sm text-theme-secondary">
              L'optimiseur de flotte utilise l'IA générative (Google Gemini 1.5 Flash) pour analyser
              les données des bateaux, captures, stocks et maintenances. Il priorise les bateaux à envoyer en mer,
              propose une répartition optimale des zones de pêche, et donne des conseils sur la gestion
              des équipages et du carburant.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
