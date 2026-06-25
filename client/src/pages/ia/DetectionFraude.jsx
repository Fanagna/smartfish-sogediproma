import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { detecterFraude } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { FiShield, FiSearch, FiRefreshCw, FiInfo, FiCpu, FiChevronLeft, FiChevronRight, FiCheckCircle, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const RISQUE = { faible: { label: 'Faible', color: 'bg-success/10 text-success' }, moyen: { label: 'Moyen', color: 'bg-warning/10 text-warning' }, eleve: { label: 'Élevé', color: 'bg-orange-100 text-orange-700' }, critique: { label: 'Critique', color: 'bg-danger/10 text-danger' } }
const STATUT_FRAUDE = { en_attente: { label: 'En attente', color: 'bg-theme-card text-theme-secondary' }, en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700' }, resolu: { label: 'Résolu', color: 'bg-success/10 text-success' }, faux_positif: { label: 'Faux positif', color: 'bg-purple-100 text-purple-700' } }

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function DetectionFraude() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [risqueFilter, setRisqueFilter] = useState('')
  const [fraudesList, setFraudesList] = useState([])
  const limit = 15

  const detectMutation = useMutation({
    mutationFn: detecterFraude,
    onSuccess: (data) => {
      const detected = data?.fraudesDetectees || data?.fraudes || []
      if (detected.length > 0) {
        setFraudesList(prev => [...detected.map(f => ({ ...f, date: new Date().toISOString(), statut: 'en_attente' })), ...prev])
        toast.success(`${detected.length} fraude(s) potentielle(s) détectée(s)`)
      } else {
        toast.success('Aucune fraude détectée')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur de détection')
  })

  const filtered = fraudesList.filter(f => {
    if (search && !f.description?.toLowerCase().includes(search.toLowerCase()) && !f.type?.toLowerCase().includes(search.toLowerCase())) return false
    if (risqueFilter && f.niveauRisque !== risqueFilter) return false
    return true
  })
  const paginated = filtered.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filtered.length / limit)

  const markResolu = (idx) => {
    setFraudesList(prev => prev.map((f, i) => i === idx ? { ...f, statut: 'resolu' } : f))
    toast.success('Fraude marquée comme résolue')
  }

  const markFauxPositif = (idx) => {
    setFraudesList(prev => prev.map((f, i) => i === idx ? { ...f, statut: 'faux_positif' } : f))
    toast.success('Marqué comme faux positif')
  }

  const counts = { faible: 0, moyen: 0, eleve: 0, critique: 0 }
  fraudesList.forEach(f => { if (counts[f.niveauRisque] !== undefined) counts[f.niveauRisque]++ })

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-red-500/20 to-purple-500/20 rounded-2xl"><FiShield className="w-7 h-7 text-red-500" /></div>
            <h1 className="text-3xl font-bold text-primary">Détection de Fraude</h1>
            <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-semibold">IA10</span>
          </div>
          <p className="text-theme-secondary ml-1">{fraudesList.length} transaction(s) suspecte(s) — Analyse IA</p>
        </div>
        <Button onClick={() => detectMutation.mutate()} disabled={detectMutation.isPending} className="flex items-center gap-2">
          {detectMutation.isPending ? <Spinner className="w-4 h-4" /> : <FiCpu className="w-4 h-4" />}
          {detectMutation.isPending ? 'Analyse...' : 'Scanner les transactions'}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 rounded-xl"><FiShield className="w-5 h-5 text-red-500" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Suspectes</p><p className="text-2xl font-bold text-theme-primary">{fraudesList.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl"><FiInfo className="w-5 h-5 text-danger" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Critiques</p><p className="text-2xl font-bold text-danger">{counts.critique}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiInfo className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Élevé</p><p className="text-2xl font-bold text-warning">{counts.eleve}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiCheckCircle className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Résolues</p><p className="text-2xl font-bold text-success">{fraudesList.filter(f => f.statut === 'resolu').length}</p></div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FiSearch className="w-5 h-5 text-theme-tertiary shrink-0" />
          <input type="text" placeholder="Rechercher par description ou type..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 min-w-[150px] bg-transparent border border-theme rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
          <select value={risqueFilter} onChange={(e) => { setRisqueFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-theme rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Tout risque</option>
            {Object.entries(RISQUE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(search || risqueFilter) && <button onClick={() => { setSearch(''); setRisqueFilter(''); setPage(1) }} className="text-sm text-accent hover:underline">Réinitialiser</button>}
        </div>
      </Card>

      {/* List */}
      {paginated.length > 0 ? (
        <div className="space-y-3">
          {paginated.map((f, i) => {
            const risqueStyle = RISQUE[f.niveauRisque] || RISQUE.faible
            const statStyle = STATUT_FRAUDE[f.statut] || STATUT_FRAUDE.en_attente
            const realIdx = fraudesList.indexOf(f)
            return (
              <Card key={i} variant="glass" className="!p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${risqueStyle.color} bg-opacity-20 flex items-center justify-center shrink-0`}>
                    <FiShield className={`w-5 h-5 text-theme-primary`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${risqueStyle.color}`}>{risqueStyle.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statStyle.color}`}>{statStyle.label}</span>
                      <span className="text-[10px] text-theme-tertiary bg-theme-card px-2 py-0.5 rounded-full">{f.type?.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm text-theme-primary">{f.description}</p>
                    {f.donneesConcernees && <p className="text-xs text-theme-tertiary mt-1"><span className="font-semibold">Données :</span> {f.donneesConcernees}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {f.statut === 'en_attente' && (
                      <>
                        <button onClick={() => markFauxPositif(realIdx)} className="p-1.5 text-theme-tertiary hover:text-purple-500 hover:bg-purple-50 rounded-lg" title="Faux positif"><FiX className="w-4 h-4" /></button>
                        <button onClick={() => markResolu(realIdx)} className="p-1.5 text-theme-tertiary hover:text-success hover:bg-success/50 rounded-lg" title="Marquer résolu"><FiCheckCircle className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : fraudesList.length === 0 ? (
        <div className="text-center py-16">
          <FiShield className="w-16 h-16 mx-auto text-theme-muted mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucune fraude détectée</h3>
          <p className="text-theme-tertiary mb-6">Lancez un scan des transactions pour détecter les activités suspectes</p>
          <Button onClick={() => detectMutation.mutate()} disabled={detectMutation.isPending}>
            <FiCpu className="w-4 h-4 mr-2" /> Scanner les transactions
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
          <div className="p-2.5 bg-red-500/10 rounded-xl shrink-0"><FiShield className="w-5 h-5 text-red-500" /></div>
          <div><h3 className="font-bold text-theme-primary mb-1">À propos d'IA10</h3><p className="text-sm text-theme-secondary">Analyse les captures, stocks, ventes et exportations pour détecter les déclarations incohérentes, écarts de stock injustifiés et transactions suspectes. Chaque fraude est classée par niveau de risque.</p></div>
        </div>
      </Card>
    </div>
  )
}
