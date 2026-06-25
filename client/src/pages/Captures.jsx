import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getCaptures, createCapture, updateCapture, deleteCapture, importCaptures } from '../services/capturesService'
import { getBateaux } from '../services/bateauService'
import { FiDroplet, FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiFilter, FiUpload, FiZap } from 'react-icons/fi'
import ExportButton from '../components/ui/ExportButton'
import { exportCapturesReport } from '../utils/exportUtils'
import toast from 'react-hot-toast'

const ZONES_PECHE = ['Atlantique Nord', 'Atlantique Sud', 'Méditerranée', 'Océan Indien', 'Golfe de Guinée', 'Manche', 'Mer du Nord', 'Pacifique Sud', 'Côte Ouest Afrique', 'Côte Est Afrique']
const ESPECES = ['Thon rouge', 'Thon albacore', 'Sardine', 'Maquereau', 'Bar', 'Dorade', 'Merlu', 'Sole', 'Cabillaud', 'Hareng', 'Espadon', 'Sébaste', 'Crevette', 'Langouste', 'Crabe', 'Poulpe', 'Calmar', 'Mulet', 'Mérou', 'Pagre', 'Rouget', 'Loup de mer', 'Anchois', 'Thon listao']

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const toDateInput = (d) => d ? new Date(d).toISOString().split('T')[0] : ''

// ── CSV Import Modal ──
function CSVImportModal({ isOpen, onClose, bateaux = [] }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [csvData, setCsvData] = useState([])
  const [preview, setPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        toast.error('Fichier CSV invalide — pas assez de lignes')
        return
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const requiredFields = ['espece', 'poids', 'quantite']
      const missing = requiredFields.filter(f => !headers.includes(f))
      if (missing.length > 0) {
        toast.error(`Colonnes obligatoires manquantes: ${missing.join(', ')}. Attendues: espece, poids, quantite, [bateauId, zonePeche, date, profondeur, temperature]`)
        return
      }

      const bateauMap = {}
      bateaux.forEach(b => { bateauMap[b.nom.toLowerCase()] = b.id; bateauMap[b.immatriculation.toLowerCase()] = b.id })

      const parsed = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })

        // Try to resolve bateauId from name/immat
        if (!row.bateauid && row.bateau) row.bateauid = bateauMap[row.bateau.toLowerCase()]
        if (!row.bateauid && row.immatriculation) row.bateauid = bateauMap[row.immatriculation.toLowerCase()]
        if (!row.bateauid && bateaux.length > 0) row.bateauid = bateaux[0].id

        parsed.push(row)
      }
      setCsvData(parsed)
      setPreview(true)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await importCaptures(csvData)
      setResult(res.data)
      if (res.data.success > 0) {
        queryClient.invalidateQueries({ queryKey: ['captures'] })
        toast.success(`${res.data.success} capture(s) importée(s) avec succès`)
      }
      if (res.data.errors > 0) {
        toast.error(`${res.data.errors} erreur(s) lors de l'import`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => { setCsvData([]); setPreview(false); setResult(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose() }} title="Import CSV de captures">
      {!preview && !result && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-theme-subtle rounded-2xl p-8 text-center hover:border-accent transition-colors">
            <FiUpload className="w-10 h-10 mx-auto text-theme-muted mb-3" />
            <p className="text-sm text-theme-tertiary mb-2">Format CSV attendu :</p>
            <code className="text-xs bg-theme-surface px-3 py-1.5 rounded-lg block mb-4">
              espece,poids,quantite,bateauId,zonePeche,date,profondeur,temperature
            </code>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} className="mx-auto">
              <FiUpload className="w-4 h-4" /> Choisir un fichier CSV
            </Button>
          </div>
          <div className="text-xs text-theme-muted">
            <p className="font-medium mb-1">Conseils :</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Colonnes obligatoires : espece, poids, quantite</li>
              <li>bateauId peut être remplacé par bateau (nom) ou immatriculation</li>
              <li>Date format: YYYY-MM-DD (optionnelle, défaut: aujourd'hui)</li>
              <li>zonePeche optionnelle (défaut: Non spécifiée)</li>
            </ul>
          </div>
        </div>
      )}

      {preview && !result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-theme-secondary">{csvData.length} ligne(s) détectée(s)</p>
            <Button variant="secondary" size="sm" onClick={reset} className="text-xs">Changer de fichier</Button>
          </div>
          <div className="max-h-48 overflow-y-auto border border-theme rounded-xl">
            <table className="w-full text-xs">
              <thead><tr className="bg-theme-surface">
                <th className="px-2 py-1.5 text-left">Espèce</th>
                <th className="px-2 py-1.5 text-right">Poids</th>
                <th className="px-2 py-1.5 text-right">Qté</th>
                <th className="px-2 py-1.5 text-left">Bateau</th>
                <th className="px-2 py-1.5 text-left">Zone</th>
              </tr></thead>
              <tbody className="divide-y divide-theme-subtle">
                {csvData.slice(0, 20).map((r, i) => (
                  <tr key={i} className="hover:bg-theme-surface">
                    <td className="px-2 py-1.5">{r.espece}</td>
                    <td className="px-2 py-1.5 text-right">{r.poids}</td>
                    <td className="px-2 py-1.5 text-right">{r.quantite}</td>
                    <td className="px-2 py-1.5">{r.bateauid || r.bateau || '—'}</td>
                    <td className="px-2 py-1.5">{r.zonepeche || r.zone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 20 && <p className="text-center text-xs text-theme-muted py-2">... et {csvData.length - 20} ligne(s) supplémentaire(s)</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { reset(); onClose() }}>Annuler</Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Import en cours...' : `Importer ${csvData.length} capture(s)`}
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${result.errors > 0 ? 'bg-warning/10 border border-warning/20' : 'bg-success/10 border border-success/20'}`}>
            <p className="font-bold text-theme-primary">{result.success} capture(s) importée(s) avec succès</p>
            {result.errors > 0 && <p className="text-sm text-warning mt-1">{result.errors} erreur(s)</p>}
          </div>
          {result.errorsList?.length > 0 && (
            <div className="max-h-32 overflow-y-auto">
              {result.errorsList.map((e, i) => (
                <p key={i} className="text-xs text-danger">Ligne {e.ligne}: {e.erreur}</p>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => { reset(); onClose() }}>Fermer</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Capture Form Modal ──
function CaptureFormModal({ isOpen, onClose, capture, bateaux = [] }) {
  const queryClient = useQueryClient()
  const isEditing = !!capture

  const createMutation = useMutation({
    mutationFn: createCapture,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['captures'] }); toast.success('Capture enregistrée'); onClose() },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const updateMutation = useMutation({
    mutationFn: (data) => updateCapture(capture.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['captures'] }); toast.success('Capture mise à jour'); onClose() },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const data = {
      bateauNom: form.get('bateauNom'),
      espece: form.get('espece'),
      poids: parseFloat(form.get('poids')),
      quantite: parseInt(form.get('quantite')),
      zonePeche: form.get('zonePeche'),
      profondeur: form.get('profondeur') ? parseFloat(form.get('profondeur')) : null,
      temperature: form.get('temperature') ? parseFloat(form.get('temperature')) : null
    }
    if (isEditing) updateMutation.mutate(data)
    else createMutation.mutate(data)
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Modifier la capture' : 'Nouvelle capture'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Bateau</label>
            <input name="bateauNom" type="text" defaultValue={capture?.bateau?.nom || ''} list="bateauxList" required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="Ex: Le Marin, SF-001..." />
            <datalist id="bateauxList">
              {bateaux.map(b => <option key={b.id} value={b.nom} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Espèce</label>
            <input name="espece" type="text" defaultValue={capture?.espece || ''} list="especesList" required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="Ex: Thon rouge, Sardine..." />
            <datalist id="especesList">
              {ESPECES.map(e => <option key={e} value={e} />)}
            </datalist>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Poids total (kg)</label>
            <input name="poids" type="number" step="0.1" min="0" defaultValue={capture?.poids || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="150.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Quantité</label>
            <input name="quantite" type="number" min="1" step="1" defaultValue={capture?.quantite || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="50" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Zone de pêche</label>
            <input name="zonePeche" type="text" defaultValue={capture?.zonePeche || ''} list="zonesList" required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="Ex: Zone A, Océan Indien..." />
            <datalist id="zonesList">
              {ZONES_PECHE.map(z => <option key={z} value={z} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Profondeur (m)</label>
            <input name="profondeur" type="number" step="1" min="0" defaultValue={capture?.profondeur || ''} className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="150" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1">Température de l'eau (°C)</label>
          <input name="temperature" type="number" step="0.1" defaultValue={capture?.temperature || ''} className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="22.5" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={isMutating}>
            {isMutating ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer la capture'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Captures() {
  const [page, setPage] = useState(1)
  const [searchEspece, setSearchEspece] = useState('')
  const [filterDateDebut, setFilterDateDebut] = useState('')
  const [filterDateFin, setFilterDateFin] = useState('')
  const [filterBateauId, setFilterBateauId] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [editingCapture, setEditingCapture] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedCapture, setSelectedCapture] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const limit = 12
  const queryClient = useQueryClient()

  const queryParams = { page, limit }
  if (searchEspece) queryParams.espece = searchEspece
  if (filterDateDebut) queryParams.dateDebut = filterDateDebut
  if (filterDateFin) queryParams.dateFin = filterDateFin
  if (filterBateauId) queryParams.bateauId = filterBateauId

  const { data: capturesData, isLoading } = useQuery({
    queryKey: ['captures', page, searchEspece, filterDateDebut, filterDateFin, filterBateauId],
    queryFn: () => getCaptures(queryParams)
  })

  const { data: bateaux } = useQuery({
    queryKey: ['bateaux'],
    queryFn: getBateaux
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCapture,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['captures'] }); toast.success('Capture supprimée'); setDeleteConfirm(null) },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const captures = capturesData?.captures || []
  const pagination = capturesData?.pagination || { page: 1, limit, total: 0, pages: 1 }

  const resetFilters = () => {
    setSearchEspece(''); setFilterDateDebut(''); setFilterDateFin(''); setFilterBateauId(''); setPage(1)
  }

  const hasActiveFilters = searchEspece || filterDateDebut || filterDateFin || filterBateauId

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Captures</h1>
          <p className="text-theme-secondary">{pagination.total} capture(s) enregistrée(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            onExportPDF={() => exportCapturesReport(captures)}
            onExportExcel={async () => {
              const { exportToExcel } = await import('../utils/exportUtils')
              await exportToExcel(captures, [
                { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('fr-FR') },
                { key: 'bateau.nom', label: 'Bateau' },
                { key: 'espece', label: 'Espèce' },
                { key: 'poids', label: 'Poids (kg)', render: (r) => r.poids.toFixed(1) },
                { key: 'quantite', label: 'Qté' },
                { key: 'zonePeche', label: 'Zone' },
              ], 'captures', 'Captures')
            }}
            size="sm"
          />
          <Button variant="secondary" onClick={() => setCsvModalOpen(true)} className="flex items-center gap-2">
            <FiUpload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setEditingCapture(null); setModalOpen(true) }} className="flex items-center gap-2">
            <FiZap className="w-4 h-4" /> Capture Rapide
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setEditingCapture(null); setModalOpen(true) }} className="flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Nouvelle
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <Card variant="glass" className="!p-4">
        <div className="flex items-center gap-3">
          <FiSearch className="w-5 h-5 text-theme-muted shrink-0" />
          <input type="text" placeholder="Rechercher par espèce..." value={searchEspece}
            onChange={(e) => { setSearchEspece(e.target.value); setPage(1) }}
            className="flex-1 bg-transparent border-none outline-none text-theme-secondary placeholder-gray-400" />
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${showFilters || hasActiveFilters ? 'bg-primary/10 text-primary' : 'text-theme-secondary hover:bg-theme-surface'}`}>
            <FiFilter className="w-4 h-4" /> Filtres
          </button>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-sm text-accent hover:underline shrink-0">Réinitialiser</button>
          )}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 mt-4 pt-4 border-t border-theme">
            <div>
              <label className="block text-xs text-theme-secondary mb-1">Date début</label>
              <input type="date" value={filterDateDebut} onChange={(e) => { setFilterDateDebut(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-theme-subtle rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-theme-secondary mb-1">Date fin</label>
              <input type="date" value={filterDateFin} onChange={(e) => { setFilterDateFin(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-theme-subtle rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-theme-secondary mb-1">Bateau</label>
              <select value={filterBateauId} onChange={(e) => { setFilterBateauId(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-theme-subtle rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none">
                <option value="">Tous les bateaux</option>
                {bateaux?.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="w-10 h-10 border-primary" />
            <p className="text-theme-secondary">Chargement des captures...</p>
          </div>
        </div>
      )}

      {/* Captures Table */}
      {!isLoading && captures.length > 0 && (
        <Card variant="glass" className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-surface border-b border-theme">
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Bateau</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Espèce</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Poids (kg)</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Qté</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Zone</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {captures.map(capture => (
                  <tr key={capture.id} className="hover:bg-theme-card transition-colors cursor-pointer" onClick={() => openDetail(capture)}>
                    <td className="px-4 py-3 text-theme-secondary whitespace-nowrap">{formatDate(capture.date)}</td>
                    <td className="px-4 py-3"><span className="font-medium text-theme-primary">{capture.bateau?.nom || '—'}</span></td>
                    <td className="px-4 py-3"><span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">{capture.espece}</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-theme-primary">{capture.poids.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-theme-secondary">{capture.quantite}</td>
                    <td className="px-4 py-3 text-theme-tertiary">{capture.zonePeche}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(capture)} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg" title="Modifier"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(capture.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg" title="Supprimer"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme bg-theme-card">
            <p className="text-sm text-theme-secondary">Page {pagination.page} sur {pagination.pages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed"><FiChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed"><FiChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && captures.length === 0 && (
        <div className="text-center py-16">
          <FiDroplet className="w-16 h-16 mx-auto text-theme-muted mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucune capture</h3>
          <p className="text-theme-muted mb-2">{hasActiveFilters ? 'Aucune capture correspondant aux filtres' : 'Enregistrez votre première capture'}</p>
          {hasActiveFilters && <button onClick={resetFilters} className="text-accent hover:underline text-sm">Réinitialiser les filtres</button>}
          {!hasActiveFilters && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="primary" onClick={() => { setEditingCapture(null); setModalOpen(true) }} className="flex items-center gap-2 mx-auto"><FiZap className="w-4 h-4" /> Capture Rapide</Button>
              <Button variant="secondary" onClick={() => setCsvModalOpen(true)} className="flex items-center gap-2"><FiUpload className="w-4 h-4" /> Import CSV</Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CaptureFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingCapture(null) }} capture={editingCapture} bateaux={bateaux || []} />
      <CSVImportModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} bateaux={bateaux || []} />
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Détails de la capture">
        {selectedCapture && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Date</p><p className="font-semibold text-theme-primary">{formatDate(selectedCapture.date)}</p></div>
              <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Bateau</p><p className="font-semibold text-theme-primary">{selectedCapture.bateau?.nom || '—'}</p></div>
              <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Espèce</p><p className="font-semibold text-theme-primary">{selectedCapture.espece}</p></div>
              <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Enregistré par</p><p className="font-semibold text-theme-primary">{selectedCapture.user?.prenom} {selectedCapture.user?.nom}</p></div>
              <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Poids total</p><p className="font-semibold text-theme-primary">{selectedCapture.poids.toFixed(1)} kg</p></div>
              <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Quantité</p><p className="font-semibold text-theme-primary">{selectedCapture.quantite} pièce(s)</p></div>
              <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Zone</p><p className="font-semibold text-theme-primary">{selectedCapture.zonePeche}</p></div>
              <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Poids unitaire moyen</p><p className="font-semibold text-theme-primary">{(selectedCapture.poids / selectedCapture.quantite).toFixed(2)} kg</p></div>
              {selectedCapture.profondeur && <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Profondeur</p><p className="font-semibold text-theme-primary">{selectedCapture.profondeur} m</p></div>}
              {selectedCapture.temperature && <div className="bg-theme-surface rounded-xl p-4"><p className="text-xs text-theme-secondary mb-1">Température</p><p className="font-semibold text-theme-primary">{selectedCapture.temperature}°C</p></div>}
            </div>
            <div className="flex justify-end"><Button variant="secondary" onClick={() => setDetailModal(false)}>Fermer</Button></div>
          </div>
        )}
      </Modal>
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmer la suppression">
        <p className="text-theme-tertiary mb-6">Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
