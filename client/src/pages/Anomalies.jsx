import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { getAnomalies, updateAnomalieStatus } from '../services/anomalieService'
import { FiAlertTriangle, FiSearch, FiCheckCircle, FiClock, FiFilter, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'

const URGENCE_COLORS = {
  CRITIQUE: 'bg-danger/15 text-danger border-danger/30',
  HAUTE: 'bg-warning/15 text-warning border-warning/20',
  MOYENNE: 'bg-accent/15 text-accent border-accent/20',
  BASSE: 'bg-success/15 text-success border-success/20',
}

const STATUT_COLORS = {
  EN_ATTENTE: 'bg-warning/15 text-warning',
  EN_COURS: 'bg-accent/15 text-accent',
  TRAITE: 'bg-success/15 text-success',
}

const STATUT_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TRAITE: 'Traité',
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function AnomalieCard({ anomalie, onUpdateStatus }) {
  const [updating, setUpdating] = useState(false)

  const handleStatusChange = async (newStatus) => {
    setUpdating(true)
    try {
      await onUpdateStatus(anomalie.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  const nextStatus = anomalie.statut === 'EN_ATTENTE' ? 'EN_COURS' : anomalie.statut === 'EN_COURS' ? 'TRAITE' : null

  return (
    <Card variant="glass" className={`group hover:shadow-2xl transition-all duration-300 border-l-4 ${
      anomalie.urgence === 'CRITIQUE' ? 'border-l-danger' :
      anomalie.urgence === 'HAUTE' ? 'border-l-warning' :
      anomalie.urgence === 'MOYENNE' ? 'border-l-accent' : 'border-l-success'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            anomalie.statut === 'TRAITE' ? 'bg-success/20 text-success' :
            anomalie.statut === 'EN_COURS' ? 'bg-accent/20 text-accent' :
            'bg-warning/20 text-warning'
          }`}>
            {anomalie.statut === 'TRAITE' ? <FiCheckCircle className="w-5 h-5" /> :
             anomalie.statut === 'EN_COURS' ? <FiRefreshCw className="w-5 h-5" /> :
             <FiAlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${URGENCE_COLORS[anomalie.urgence] || URGENCE_COLORS.BASSE}`}>
                {anomalie.urgence}
              </span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUT_COLORS[anomalie.statut] || ''}`}>
                {STATUT_LABELS[anomalie.statut]}
              </span>
              <span className="text-xs px-2 py-0.5 bg-theme-surface text-theme-tertiary rounded-full">{anomalie.type}</span>
            </div>
            <p className="text-base font-semibold text-theme-primary mt-1">{anomalie.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-theme-secondary">
              {anomalie.user && <span>Signalé par: {anomalie.user.prenom} {anomalie.user.nom}</span>}
              <span>{formatDate(anomalie.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {nextStatus && (
        <div className="flex justify-end pt-3 border-t border-theme">
          <button
            onClick={() => handleStatusChange(nextStatus)}
            disabled={updating}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              nextStatus === 'EN_COURS'
                ? 'bg-accent/10 text-accent hover:bg-accent/20'
                : 'bg-success/10 text-success hover:bg-success/20'
            } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {updating ? (
              <Spinner className="w-4 h-4 border-current" />
            ) : nextStatus === 'EN_COURS' ? (
              <><FiClock className="w-4 h-4" /> Prendre en charge</>
            ) : (
              <><FiCheckCircle className="w-4 h-4" /> Marquer comme traité</>
            )}
          </button>
        </div>
      )}
    </Card>
  )
}

export default function Anomalies() {
  const [filterStatut, setFilterStatut] = useState('')
  const [filterUrgence, setFilterUrgence] = useState('')
  const queryClient = useQueryClient()

  const { data: anomalies, isLoading, isError, error } = useQuery({
    queryKey: ['anomalies', filterStatut, filterUrgence],
    queryFn: () => getAnomalies({
      ...(filterStatut && { statut: filterStatut }),
      ...(filterUrgence && { urgence: filterUrgence })
    })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, statut }) => updateAnomalieStatus(id, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      toast.success('Statut mis à jour')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const handleUpdateStatus = async (id, statut) => {
    await updateMutation.mutateAsync({ id, statut })
  }

  const counts = {
    total: anomalies?.length || 0,
    enAttente: anomalies?.filter(a => a.statut === 'EN_ATTENTE').length || 0,
    enCours: anomalies?.filter(a => a.statut === 'EN_COURS').length || 0,
    traite: anomalies?.filter(a => a.statut === 'TRAITE').length || 0,
    critique: anomalies?.filter(a => a.urgence === 'CRITIQUE').length || 0,
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Anomalies</h1>
          <p className="text-theme-secondary">{counts.total} anomalie(s) — {counts.enAttente} en attente</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-warning" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">En attente</p>
              <p className="text-2xl font-bold text-warning">{counts.enAttente}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiClock className="w-5 h-5 text-accent" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">En cours</p>
              <p className="text-2xl font-bold text-accent">{counts.enCours}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiCheckCircle className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Traités</p>
              <p className="text-2xl font-bold text-success">{counts.traite}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-danger" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Critiques</p>
              <p className="text-2xl font-bold text-danger">{counts.critique}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" className="!p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-theme-muted" />
            <span className="text-sm text-theme-tertiary font-medium">Filtrer:</span>
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 border border-theme-subtle rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="TRAITE">Traité</option>
          </select>
          <select
            value={filterUrgence}
            onChange={(e) => setFilterUrgence(e.target.value)}
            className="px-3 py-2 border border-theme-subtle rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
          >
            <option value="">Toutes les urgences</option>
            <option value="CRITIQUE">Critique</option>
            <option value="HAUTE">Haute</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="BASSE">Basse</option>
          </select>
          {(filterStatut || filterUrgence) && (
            <button
              onClick={() => { setFilterStatut(''); setFilterUrgence('') }}
              className="text-sm text-accent hover:underline ml-auto"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="w-10 h-10 border-primary" />
            <p className="text-theme-secondary">Chargement des anomalies...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-16">
          <p className="text-xl font-bold text-danger mb-2">Erreur de chargement</p>
          <p className="text-theme-tertiary">{error?.message}</p>
        </div>
      )}

      {/* Anomalies List */}
      {!isLoading && !isError && (
        <div className="space-y-4">
          {anomalies?.length > 0 ? (
            anomalies.map(anomalie => (
              <AnomalieCard key={anomalie.id} anomalie={anomalie} onUpdateStatus={handleUpdateStatus} />
            ))
          ) : (
            <div className="text-center py-16">
              <FiCheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
              <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucune anomalie</h3>
              <p className="text-theme-muted">
                {filterStatut || filterUrgence
                  ? 'Aucune anomalie ne correspond aux filtres sélectionnés'
                  : 'Tout est sous contrôle — aucune anomalie signalée'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
