import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { detectAnomaliesOperationnelles } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { FiAlertTriangle, FiSearch, FiInfo, FiCpu, FiClock, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import toast from 'react-hot-toast'

const URGENCE = { BASSE: { label: 'Basse', color: 'bg-theme-card text-theme-secondary' }, MOYENNE: { label: 'Moyenne', color: 'bg-warning/10 text-warning' }, HAUTE: { label: 'Haute', color: 'bg-orange-100 text-orange-700' }, CRITIQUE: { label: 'Critique', color: 'bg-danger/10 text-danger' } }
const STATUTS = { EN_ATTENTE: { label: 'En attente', color: 'bg-theme-card text-theme-secondary' }, EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-700' }, RESOLU: { label: 'Résolu', color: 'bg-success/10 text-success' } }

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const formatNumber = (v, d = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)

export default function AnomaliesIA() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [urgenceFilter, setUrgenceFilter] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [anomaliesList, setAnomaliesList] = useState([])
  const limit = 15

  const detectMutation = useMutation({
    mutationFn: detectAnomaliesOperationnelles,
    onSuccess: (data) => {
      const detected = data?.anomaliesDetectees || data?.anomalies || []
      if (detected.length > 0) {
        setAnomaliesList(prev => [...detected.map(a => ({ ...a, date: new Date().toISOString(), statut: 'EN_ATTENTE' })), ...prev])
        toast.success(`${detected.length} anomalie(s) détectée(s)`)
      } else {
        toast.success('Aucune anomalie détectée')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur de détection')
  })

  const filtered = anomaliesList.filter(a => {
    if (search && !a.description?.toLowerCase().includes(search.toLowerCase()) && !a.type?.toLowerCase().includes(search.toLowerCase())) return false
    if (urgenceFilter && a.urgence !== urgenceFilter) return false
    if (statutFilter && a.statut !== statutFilter) return false
    return true
  })

  const paginated = filtered.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filtered.length / limit)

  const markResolu = (idx) => {
    setAnomaliesList(prev => prev.map((a, i) => i === idx ? { ...a, statut: 'RESOLU' } : a))
    toast.success('Anomalie marquée comme résolue')
  }

  const counts = { BASSE: 0, MOYENNE: 0, HAUTE: 0, CRITIQUE: 0 }
  anomaliesList.forEach(a => { if (counts[a.urgence] !== undefined) counts[a.urgence]++ })

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-danger/20 to-orange-500/20 rounded-2xl"><FiAlertTriangle className="w-7 h-7 text-danger" /></div>
            <h1 className="text-3xl font-bold text-primary">Anomalies</h1>
            <span className="px-2.5 py-1 bg-danger/10 text-danger rounded-full text-xs font-semibold">IA9</span>
          </div>
          <p className="text-theme-secondary ml-1">{anomaliesList.length} anomalie(s) — Détection intelligente par IA</p>
        </div>
        <Button onClick={() => detectMutation.mutate()} disabled={detectMutation.isPending} className="flex items-center gap-2">
          {detectMutation.isPending ? <Spinner className="w-4 h-4" /> : <FiCpu className="w-4 h-4" />}
          {detectMutation.isPending ? 'Analyse...' : 'Lancer la détection'}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Totales</p><p className="text-2xl font-bold text-theme-primary">{anomaliesList.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiInfo className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Critiques</p><p className="text-2xl font-bold text-danger">{counts.CRITIQUE}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiClock className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">En attente</p><p className="text-2xl font-bold text-warning">{anomaliesList.filter(a => a.statut === 'EN_ATTENTE' || a.statut === 'EN_COURS').length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="p-2.5 bg-success/10 rounded-xl"><FiCheckCircle className="w-5 h-5 text-success" /></div>
          <div><p className="text-xs text-theme-secondary font-medium">Résolues</p><p className="text-2xl font-bold text-success">{anomaliesList.filter(a => a.statut === 'RESOLU').length}</p></div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FiSearch className="w-5 h-5 text-theme-tertiary shrink-0" />
          <input type="text" placeholder="Rechercher par description ou type..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 min-w-[150px] bg-transparent border border-theme rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent text-theme-primary placeholder-theme-muted" />
          <select value={urgenceFilter} onChange={(e) => { setUrgenceFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-theme rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Toute urgence</option>
            {Object.entries(URGENCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-theme rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Tout statut</option>
            {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(search || urgenceFilter || statutFilter) && <button onClick={() => { setSearch(''); setUrgenceFilter(''); setStatutFilter(''); setPage(1) }} className="text-sm text-accent hover:underline">Réinitialiser</button>}
        </div>
      </Card>

      {/* List */}
      {paginated.length > 0 ? (
        <div className="space-y-3">
          {paginated.map((a, i) => {
            const urgStyle = URGENCE[a.urgence] || URGENCE.BASSE
            const statStyle = STATUTS[a.statut] || STATUTS.EN_ATTENTE
            const realIdx = anomaliesList.indexOf(a)
            return (
              <Card key={i} variant="glass" className="!p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${urgStyle.color} bg-opacity-20 flex items-center justify-center shrink-0`}>
                    <FiAlertTriangle className={`w-5 h-5 ${urgStyle.color.replace('bg-', 'text-').replace('/10', '')}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${urgStyle.color}`}>{urgStyle.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statStyle.color}`}>{statStyle.label}</span>
                      <span className="text-[10px] text-theme-tertiary">{a.type}</span>
                    </div>
                    <p className="text-sm text-theme-primary">{a.description}</p>
                    {a.details && <p className="text-xs text-theme-tertiary mt-1">{a.details}</p>}
                    <p className="text-[10px] text-theme-tertiary mt-1">{formatDate(a.date)}</p>
                  </div>
                  {a.statut !== 'RESOLU' && (
                    <button onClick={() => markResolu(realIdx)} className="p-2 text-success hover:bg-success/10 rounded-lg transition-all shrink-0" title="Marquer résolu">
                      <FiCheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : anomaliesList.length === 0 ? (
        <div className="text-center py-16">
          <FiAlertTriangle className="w-16 h-16 mx-auto text-theme-tertiary mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucune anomalie</h3>
          <p className="text-theme-tertiary mb-6">Lancez une détection IA pour analyser les données</p>
          <Button onClick={() => detectMutation.mutate()} disabled={detectMutation.isPending}>
            <FiCpu className="w-4 h-4 mr-2" /> Lancer la détection IA
          </Button>
        </div>
      ) : (
        <div className="text-center py-12 text-theme-tertiary"><FiInfo className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Aucun résultat pour ces filtres</p></div>
      )}

      {/* Pagination */}
      {filtered.length > limit && (
        <div className="flex items-center justify-between px-4 py-3 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl">
          <p className="text-sm text-theme-secondary">Page {page} sur {totalPages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-danger/10 rounded-xl shrink-0"><FiCpu className="w-5 h-5 text-danger" /></div>
          <div><h3 className="font-bold text-theme-primary mb-1">À propos d'IA9</h3><p className="text-sm text-theme-secondary">Détecteur d'anomalies opérationnelles utilisant Gemini 1.5 Flash. Analyse les captures, stocks, bateaux et maintenances pour détecter incohérences, niveaux critiques et maintenance overdue.</p></div>
        </div>
      </Card>
    </div>
  )
}
