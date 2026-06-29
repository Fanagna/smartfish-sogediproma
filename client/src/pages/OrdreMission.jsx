import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getOrdresMission, getOrdreMissionById, createOrdreMission, updateOrdreMission, deleteOrdreMission } from '../services/ordreMissionService'
import { generateOrdreMissionPDF, printOrdreMission, nombreEnLettres, totalIndemnites } from '../utils/ordreMissionPDF'
import { FiFileText, FiPlus, FiEdit2, FiTrash2, FiSearch, FiPrinter, FiDownload, FiSave, FiRotateCcw, FiEye, FiChevronLeft, FiChevronRight, FiUsers, FiPackage, FiDroplet, FiAnchor, FiCalendar, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'

// ── Constantes ──
const TYPE_BATEAUX = ['Pêche côtière', 'Pêche hauturière', 'Thonier', 'Chalutier', 'Palangrier', 'Fileyeur', 'Caseyeur', 'Dragueur', 'Senneur', 'Polyvalent']

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const formatDateTime = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const toDateInput = (d) => d ? new Date(d).toISOString().split('T')[0] : ''
const toDateTimeInput = (d) => d ? new Date(d).toISOString().slice(0, 16) : ''

const initialEquipage = () => [{ nom: '', fonction: '', montantUnitaire: 0, nombreJours: 1, total: 0 }]
const initialMarchandises = () => [{ designation: '', quantite: '', unite: '', observation: '' }]
const initialPassagers = () => [{ nom: '', cin: '', fonction: '' }]
const initialDiversFrais = () => [{ designation: '', montant: '' }]

const emptyForm = {
  numero: '',
  date: toDateInput(new Date()),
  bateauNom: '',
  bateauType: '',
  objetMission: '',
  destination: '',
  chefMission: '',
  capitaine: '',
  equipage: initialEquipage(),
  dateDepart: '',
  dateArrivee: '',
  heureDepart: '',
  heureArrivee: '',
  vidangeDate: '',
  vidangeTotal: '',
  vidangeProchaine: '',
  carburantRestant: '',
  carburantRemplissage: '',
  carburantDepart: '',
  carburantConsommation: '',
  carburantArrivee: '',
  marchandises: initialMarchandises(),
  passagers: initialPassagers(),
  diversFrais: initialDiversFrais(),
}

// Calcul des heures de parcours
function calculerHeuresParcours(dateDepart, dateArrivee) {
  if (!dateDepart || !dateArrivee) return null
  const dep = new Date(dateDepart)
  const arr = new Date(dateArrivee)
  if (isNaN(dep) || isNaN(arr)) return null
  const diffMs = Math.abs(arr - dep)
  const heures = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  return { heures, minutes, totalHeures: +(heures + minutes / 60).toFixed(1) }
}

export default function OrdreMission() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState('list') // 'list' | 'form' | 'view'
  const [form, setForm] = useState({ ...emptyForm })
  const [selectedId, setSelectedId] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ── Queries ──
  const { data: listData, isLoading } = useQuery({
    queryKey: ['ordres-mission', page, search],
    queryFn: () => getOrdresMission({ page, limit: 10, search })
  })

  const { data: ordreDetail } = useQuery({
    queryKey: ['ordre-mission', selectedId],
    queryFn: () => getOrdreMissionById(selectedId),
    enabled: !!selectedId && mode === 'view'
  })

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: createOrdreMission,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ordres-mission'] })
      toast.success('Ordre de mission créé avec succès')
      setSelectedId(data.id)
      setMode('view')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur lors de la création')
  })

  const updateMutation = useMutation({
    mutationFn: (data) => updateOrdreMission(selectedId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordres-mission'] })
      queryClient.invalidateQueries({ queryKey: ['ordre-mission', selectedId] })
      toast.success('Ordre de mission mis à jour')
      setMode('view')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour')
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOrdreMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordres-mission'] })
      toast.success('Ordre de mission supprimé')
      setDeleteConfirm(null)
      if (selectedId === deleteConfirm) { setSelectedId(null); setMode('list') }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur lors de la suppression')
  })

  const isMutating = createMutation.isPending || updateMutation.isPending

  const ordres = listData?.ordres || []
  const pagination = listData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 }

  // ── Form handlers ──
  const updateField = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      // Auto-calcul carburant
      if (['carburantRestant', 'carburantRemplissage'].includes(field)) {
        const restant = parseFloat(field === 'carburantRestant' ? value : prev.carburantRestant) || 0
        const remplissage = parseFloat(field === 'carburantRemplissage' ? value : prev.carburantRemplissage) || 0
        updated.carburantDepart = restant + remplissage
      }
      if (field === 'carburantArrivee' || field === 'carburantDepart') {
        const depart = parseFloat(field === 'carburantDepart' ? value : prev.carburantDepart) || 0
        const arrivee = parseFloat(field === 'carburantArrivee' ? value : prev.carburantArrivee) || 0
        updated.carburantConsommation = Math.max(0, depart - arrivee)
      }
      // Auto-calcul vidangeProchaine
      if (field === 'vidangeTotal') {
        const total = parseFloat(value) || 0
        updated.vidangeProchaine = total > 0 ? total + 150 : ''
      }
      return updated
    })
  }

  const updateEquipage = (index, field, value) => {
    setForm(prev => {
      const equipage = [...prev.equipage]
      equipage[index] = { ...equipage[index], [field]: value }
      // Recalcul total pour ce membre
      const mt = parseFloat(equipage[index].montantUnitaire) || 0
      const jrs = parseInt(equipage[index].nombreJours) || 0
      equipage[index].total = mt * jrs
      return { ...prev, equipage }
    })
  }

  const addEquipageMember = () => setForm(prev => ({
    ...prev, equipage: [...prev.equipage, { nom: '', fonction: '', montantUnitaire: 0, nombreJours: 1, total: 0 }]
  }))

  const removeEquipageMember = (index) => {
    if (form.equipage.length <= 1) return
    setForm(prev => ({ ...prev, equipage: prev.equipage.filter((_, i) => i !== index) }))
  }

  const updateMarchandise = (index, field, value) => {
    setForm(prev => {
      const marchandises = [...prev.marchandises]
      marchandises[index] = { ...marchandises[index], [field]: value }
      return { ...prev, marchandises }
    })
  }

  const addMarchandise = () => setForm(prev => ({
    ...prev, marchandises: [...prev.marchandises, { designation: '', quantite: '', unite: '', observation: '' }]
  }))

  const removeMarchandise = (index) => {
    if (form.marchandises.length <= 1) return
    setForm(prev => ({ ...prev, marchandises: prev.marchandises.filter((_, i) => i !== index) }))
  }

  const updatePassager = (index, field, value) => {
    setForm(prev => {
      const passagers = [...prev.passagers]
      passagers[index] = { ...passagers[index], [field]: value }
      return { ...prev, passagers }
    })
  }

  const addPassager = () => setForm(prev => ({
    ...prev, passagers: [...prev.passagers, { nom: '', cin: '', fonction: '' }]
  }))

  const removePassager = (index) => {
    if (form.passagers.length <= 1) return
    setForm(prev => ({ ...prev, passagers: prev.passagers.filter((_, i) => i !== index) }))
  }

  const updateDiversFrais = (index, field, value) => {
    setForm(prev => {
      const diversFrais = [...prev.diversFrais]
      diversFrais[index] = { ...diversFrais[index], [field]: value }
      return { ...prev, diversFrais }
    })
  }

  const addDiversFrais = () => setForm(prev => ({
    ...prev, diversFrais: [...prev.diversFrais, { designation: '', montant: '' }]
  }))

  const removeDiversFrais = (index) => {
    if (form.diversFrais.length <= 1) return
    setForm(prev => ({ ...prev, diversFrais: prev.diversFrais.filter((_, i) => i !== index) }))
  }

  // ── Actions ──
  const handleNew = () => {
    setForm({ ...emptyForm, date: toDateInput(new Date()) })
    setSelectedId(null)
    setMode('form')
  }

  const handleEdit = (ordre) => {
    setForm({
      numero: ordre.numero || '',
      date: toDateInput(ordre.date),
      bateauNom: ordre.bateauNom || '',
      bateauType: ordre.bateauType || '',
      objetMission: ordre.objetMission || '',
      destination: ordre.destination || '',
      chefMission: ordre.chefMission || '',
      capitaine: ordre.capitaine || '',
      equipage: Array.isArray(ordre.equipage) && ordre.equipage.length > 0
        ? ordre.equipage.map(m => ({ nom: m.nom || '', fonction: m.fonction || '', montantUnitaire: m.montantUnitaire || 0, nombreJours: m.nombreJours || 1, total: (m.montantUnitaire || 0) * (m.nombreJours || 1) }))
        : initialEquipage(),
      dateDepart: toDateTimeInput(ordre.dateDepart),
      dateArrivee: toDateTimeInput(ordre.dateArrivee),
      heureDepart: ordre.heureDepart || '',
      heureArrivee: ordre.heureArrivee || '',
      vidangeDate: toDateInput(ordre.vidangeDate),
      vidangeTotal: ordre.vidangeTotal || '',
      vidangeProchaine: ordre.vidangeProchaine || '',
      carburantRestant: ordre.carburantRestant || '',
      carburantRemplissage: ordre.carburantRemplissage || '',
      carburantDepart: ordre.carburantDepart || '',
      carburantConsommation: ordre.carburantConsommation || '',
      carburantArrivee: ordre.carburantArrivee || '',
      marchandises: Array.isArray(ordre.marchandises) && ordre.marchandises.length > 0
        ? ordre.marchandises.map(m => ({ designation: m.designation || '', quantite: m.quantite || '', unite: m.unite || '', observation: m.observation || '' }))
        : initialMarchandises(),
      passagers: Array.isArray(ordre.passagers) && ordre.passagers.length > 0
        ? ordre.passagers.map(p => ({ nom: p.nom || '', cin: p.cin || '', fonction: p.fonction || '' }))
        : initialPassagers(),
      diversFrais: Array.isArray(ordre.diversFrais) && ordre.diversFrais.length > 0
        ? ordre.diversFrais.map(d => ({ designation: d.designation || '', montant: d.montant || '' }))
        : initialDiversFrais(),
    })
    setSelectedId(ordre.id)
    setMode('form')
  }

  const handleView = (id) => {
    setSelectedId(id)
    setMode('view')
  }

  const handleSave = () => {
    // Validation
    if (!form.numero.trim()) { toast.error('Numéro d\'ordre de mission requis'); return }
    if (!form.bateauNom.trim()) { toast.error('Nom du bateau requis'); return }
    if (!form.bateauType.trim()) { toast.error('Type du bateau requis'); return }
    if (!form.objetMission.trim()) { toast.error('Objet de la mission requis'); return }
    if (!form.destination.trim()) { toast.error('Destination requise'); return }
    if (!form.chefMission.trim()) { toast.error('Chef de mission requis'); return }
    if (!form.capitaine.trim()) { toast.error('Capitaine requis'); return }
    if (!form.dateDepart) { toast.error('Date de départ requise'); return }
    if (!form.dateArrivee) { toast.error('Date d\'arrivée requise'); return }

    const payload = {
      numero: form.numero,
      date: form.date || new Date().toISOString(),
      bateauNom: form.bateauNom,
      bateauType: form.bateauType,
      objetMission: form.objetMission,
      destination: form.destination,
      chefMission: form.chefMission,
      capitaine: form.capitaine,
      equipage: form.equipage.map(m => ({
        nom: m.nom, fonction: m.fonction,
        montantUnitaire: parseFloat(m.montantUnitaire) || 0,
        nombreJours: parseInt(m.nombreJours) || 0,
        total: (parseFloat(m.montantUnitaire) || 0) * (parseInt(m.nombreJours) || 0)
      })),
      dateDepart: new Date(form.dateDepart).toISOString(),
      dateArrivee: new Date(form.dateArrivee).toISOString(),
      heureDepart: form.heureDepart,
      heureArrivee: form.heureArrivee,
      vidangeDate: form.vidangeDate ? new Date(form.vidangeDate).toISOString() : null,
      vidangeTotal: parseFloat(form.vidangeTotal) || 0,
      vidangeProchaine: parseFloat(form.vidangeProchaine) || 0,
      carburantRestant: parseFloat(form.carburantRestant) || 0,
      carburantRemplissage: parseFloat(form.carburantRemplissage) || 0,
      carburantArrivee: parseFloat(form.carburantArrivee) || 0,
      marchandises: form.marchandises.filter(m => m.designation.trim()),
      passagers: form.passagers.filter(p => p.nom.trim()),
      diversFrais: form.diversFrais.filter(d => d.designation.trim()),
    }

    if (selectedId) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleExportPDF = async () => {
    if (mode === 'view' && ordreDetail) {
      await generateOrdreMissionPDF(ordreDetail)
      toast.success('PDF généré avec succès')
    } else if (mode === 'form') {
      // Save first then export
      toast('Veuillez d\'abord enregistrer l\'ordre de mission')
    }
  }

  const handlePrint = async () => {
    if (mode === 'view' && ordreDetail) {
      await printOrdreMission(ordreDetail)
    } else {
      toast('Veuillez d\'abord enregistrer l\'ordre de mission')
    }
  }

  const totalIndem = totalIndemnites(form.equipage)

  // ── Calcul des stats ──
  const stats = {
    total: pagination.total,
    enCours: ordres.filter(o => {
      if (!o.dateDepart || !o.dateArrivee) return false
      const now = new Date()
      const dep = new Date(o.dateDepart)
      const arr = new Date(o.dateArrivee)
      return now >= dep && now <= arr
    }).length,
    aVenir: ordres.filter(o => {
      if (!o.dateDepart) return false
      return new Date(o.dateDepart) > new Date()
    }).length,
    termines: ordres.filter(o => {
      if (!o.dateArrivee) return false
      return new Date(o.dateArrivee) < new Date()
    }).length
  }

  // ── Render: Liste ──
  if (mode === 'list') {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">Ordres de Mission</h1>
            <p className="text-theme-secondary">{pagination.total} ordre(s) de mission</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleNew} className="flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Nouvel Ordre de Mission
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card variant="glass" className="!p-3 !pb-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><FiFileText className="w-4 h-4 text-primary" /></div>
              <div><p className="text-[10px] text-theme-tertiary uppercase tracking-wider">Total</p>
                <p className="text-xl font-bold text-primary">{stats.total}</p></div>
            </div>
          </Card>
          <Card variant="glass" className="!p-3 !pb-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-xl"><FiRotateCcw className="w-4 h-4 text-accent" /></div>
              <div><p className="text-[10px] text-theme-tertiary uppercase tracking-wider">En cours</p>
                <p className="text-xl font-bold text-accent">{stats.enCours}</p></div>
            </div>
          </Card>
          <Card variant="glass" className="!p-3 !pb-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-xl"><FiCalendar className="w-4 h-4 text-warning" /></div>
              <div><p className="text-[10px] text-theme-tertiary uppercase tracking-wider">À venir</p>
                <p className="text-xl font-bold text-warning">{stats.aVenir}</p></div>
            </div>
          </Card>
          <Card variant="glass" className="!p-3 !pb-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-xl"><FiCheckCircle className="w-4 h-4 text-success" /></div>
              <div><p className="text-[10px] text-theme-tertiary uppercase tracking-wider">Terminés</p>
                <p className="text-xl font-bold text-success">{stats.termines}</p></div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <FiSearch className="w-5 h-5 text-theme-muted shrink-0" />
            <input type="text" placeholder="Rechercher par numéro, bateau, destination..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent border-none outline-none text-theme-secondary placeholder-theme-muted" />
          </div>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="w-10 h-10 border-primary" />
              <p className="text-theme-secondary">Chargement...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && ordres.length > 0 && (
          <Card variant="glass" className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-theme-surface border-b border-theme">
                    <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">N° Ordre</th>
                    <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Bateau</th>
                    <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Destination</th>
                    <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Chef de mission</th>
                    <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Date</th>
                    <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-subtle">
                  {ordres.map(ordre => (
                    <tr key={ordre.id} className="hover:bg-theme-card transition-colors cursor-pointer" onClick={() => handleView(ordre.id)}>
                      <td className="px-4 py-3"><span className="font-medium text-accent">{ordre.numero}</span></td>
                      <td className="px-4 py-3"><span className="font-medium text-theme-primary">{ordre.bateauNom}</span></td>
                      <td className="px-4 py-3 text-theme-secondary">{ordre.destination}</td>
                      <td className="px-4 py-3 text-theme-secondary">{ordre.chefMission}</td>
                      <td className="px-4 py-3 text-theme-tertiary">{formatDate(ordre.date)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleView(ordre.id)} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg" title="Voir"><FiEye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(ordre)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg" title="Modifier"><FiEdit2 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm(ordre.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg" title="Supprimer"><FiTrash2 className="w-4 h-4" /></button>
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
        {!isLoading && ordres.length === 0 && (
          <div className="text-center py-16">
            <FiFileText className="w-16 h-16 mx-auto text-theme-muted mb-4" />
            <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucun ordre de mission</h3>
            <p className="text-theme-muted mb-6">Créez votre premier ordre de mission</p>
            <Button onClick={handleNew} className="flex items-center gap-2 mx-auto"><FiPlus className="w-4 h-4" /> Nouvel Ordre de Mission</Button>
          </div>
        )}

        {/* Delete Modal */}
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

  // ── Render: Vue détail avec loading ──
  if (mode === 'view') {
    if (!ordreDetail) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="w-10 h-10 border-primary" />
            <p className="text-theme-secondary">Chargement de l'ordre de mission...</p>
          </div>
        </div>
      )
    }
    const om = ordreDetail
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">Ordre de Mission</h1>
            <p className="text-accent font-semibold">{om.numero}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setMode('list')}><FiChevronLeft className="w-4 h-4" /> Retour</Button>
            <Button variant="secondary" onClick={() => handleEdit(om)} className="flex items-center gap-2"><FiEdit2 className="w-4 h-4" /> Modifier</Button>
            <Button variant="warning" onClick={handlePrint} className="flex items-center gap-2"><FiPrinter className="w-4 h-4" /> Imprimer</Button>
            <Button onClick={handleExportPDF} className="flex items-center gap-2"><FiDownload className="w-4 h-4" /> Exporter PDF</Button>
          </div>
        </div>

        {/* Détails du document */}
        <Card variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2"><FiAnchor className="w-5 h-5" /> Informations Mission</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">N° Ordre</p><p className="font-semibold text-accent">{om.numero}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Date</p><p className="font-semibold">{formatDate(om.date)}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Bateau</p><p className="font-semibold">{om.bateauNom}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Type</p><p className="font-semibold">{om.bateauType}</p></div>
                <div className="bg-theme-surface rounded-xl p-3 col-span-2"><p className="text-xs text-theme-secondary">Objet</p><p className="font-semibold">{om.objetMission}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Destination</p><p className="font-semibold">{om.destination}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Chef de mission</p><p className="font-semibold">{om.chefMission}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Capitaine</p><p className="font-semibold">{om.capitaine}</p></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2"><FiDroplet className="w-5 h-5" /> Calendrier & Carburant</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Départ</p><p className="font-semibold">{formatDate(om.dateDepart)} {om.heureDepart}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Arrivée</p><p className="font-semibold">{formatDate(om.dateArrivee)} {om.heureArrivee}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Stock départ (L)</p><p className="font-semibold">{om.carburantDepart || '—'}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Consommation (L)</p><p className="font-semibold text-warning">{om.carburantConsommation || '—'}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Stock arrivée (L)</p><p className="font-semibold">{om.carburantArrivee || '—'}</p></div>
                <div className="bg-theme-surface rounded-xl p-3"><p className="text-xs text-theme-secondary">Prochaine vidange</p><p className="font-semibold">{om.vidangeProchaine ? `${om.vidangeProchaine} H` : '—'}</p></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Équipage */}
        <Card variant="glass">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><FiUsers className="w-5 h-5" /> Équipage / Indemnités</h3>
          {Array.isArray(om.equipage) && om.equipage.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-theme-surface border-b border-theme">
                  <th className="text-left px-4 py-2 text-theme-tertiary font-semibold">Nom</th>
                  <th className="text-left px-4 py-2 text-theme-tertiary font-semibold">Fonction</th>
                  <th className="text-right px-4 py-2 text-theme-tertiary font-semibold">Mt Unitaire</th>
                  <th className="text-center px-4 py-2 text-theme-tertiary font-semibold">Jours</th>
                  <th className="text-right px-4 py-2 text-theme-tertiary font-semibold">Total (Ar)</th>
                </tr></thead>
                <tbody className="divide-y divide-theme-subtle">
                  {om.equipage.map((m, i) => (
                    <tr key={i}><td className="px-4 py-2 font-medium">{m.nom}</td><td className="px-4 py-2 text-theme-secondary">{m.fonction}</td>
                      <td className="px-4 py-2 text-right">{(m.montantUnitaire || 0).toLocaleString('fr-MG')}</td>
                      <td className="px-4 py-2 text-center">{m.nombreJours}</td>
                      <td className="px-4 py-2 text-right font-semibold">{(m.total || 0).toLocaleString('fr-MG')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-primary/5">
                  <td colSpan={4} className="px-4 py-2 text-right font-bold text-primary">Total Indemnités</td>
                  <td className="px-4 py-2 text-right font-bold text-primary">{totalIndemnites(om.equipage).toLocaleString('fr-MG')} Ar</td>
                </tr></tfoot>
              </table>
            </div>
          ) : <p className="text-theme-muted italic">Aucun équipage renseigné</p>}
          <p className="text-xs text-theme-tertiary mt-3 italic">Soit {nombreEnLettres(totalIndemnites(om.equipage))}</p>
        </Card>

        {/* Marchandises */}
        <Card variant="glass">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><FiPackage className="w-5 h-5" /> Marchandises à embarquer</h3>
          {Array.isArray(om.marchandises) && om.marchandises.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-theme-surface border-b border-theme">
                  <th className="text-left px-4 py-2 text-theme-tertiary font-semibold">N°</th>
                  <th className="text-left px-4 py-2 text-theme-tertiary font-semibold">Désignation</th>
                  <th className="text-right px-4 py-2 text-theme-tertiary font-semibold">Quantité</th>
                  <th className="text-center px-4 py-2 text-theme-tertiary font-semibold">Unité</th>
                  <th className="text-left px-4 py-2 text-theme-tertiary font-semibold">Observation</th>
                </tr></thead>
                <tbody className="divide-y divide-theme-subtle">
                  {om.marchandises.map((m, i) => (
                    <tr key={i}><td className="px-4 py-2">{i + 1}</td><td className="px-4 py-2 font-medium">{m.designation}</td>
                      <td className="px-4 py-2 text-right">{m.quantite}</td><td className="px-4 py-2 text-center">{m.unite}</td>
                      <td className="px-4 py-2 text-theme-tertiary">{m.observation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-theme-muted italic">Aucune marchandise</p>}
        </Card>

        {/* Divers Frais */}
        <Card variant="glass">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><FiDroplet className="w-5 h-5" /> Divers Frais</h3>
          {Array.isArray(om.diversFrais) && om.diversFrais.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-theme-surface border-b border-theme">
                  <th className="text-left px-4 py-2 text-theme-tertiary font-semibold">Désignation</th>
                  <th className="text-right px-4 py-2 text-theme-tertiary font-semibold">Montant (Ar)</th>
                </tr></thead>
                <tbody className="divide-y divide-theme-subtle">
                  {om.diversFrais.map((d, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{d.designation}</td>
                      <td className="px-4 py-2 text-right font-semibold">{(d.montant || 0).toLocaleString('fr-MG')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-primary/5">
                  <td className="px-4 py-2 text-right font-bold text-primary">Total Divers Frais</td>
                  <td className="px-4 py-2 text-right font-bold text-primary">{om.diversFrais.reduce((s, d) => s + (parseFloat(d.montant) || 0), 0).toLocaleString('fr-MG')} Ar</td>
                </tr></tfoot>
              </table>
            </div>
          ) : <p className="text-theme-muted italic">Aucun frais</p>}
        </Card>

        {/* Signatures */}
        <Card variant="glass" className="text-center">
          <h3 className="text-lg font-bold text-primary mb-6">Signatures</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['L\'ARMEMENT', 'LA DIRECTION', 'LE CAPITAINE'].map(label => (
              <div key={label} className="pt-8">
                <p className="font-bold text-primary mb-8 border-t border-dashed border-theme-strong pt-2">{label}</p>
                <p className="text-xs text-theme-muted">Nom & Signature</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: FORMULAIRE
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 pb-4 bg-theme-base/80 backdrop-blur-xl -mx-6 px-6 -mt-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            {selectedId ? 'Modifier' : 'Nouvel'} Ordre de Mission
          </h1>
          <p className="text-theme-secondary">Remplissez tous les champs obligatoires</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setMode('list')}><FiChevronLeft className="w-4 h-4" /> Annuler</Button>
          <Button variant="success" onClick={handleSave} disabled={isMutating} className="flex items-center gap-2">
            <FiSave className="w-4 h-4" />
            {isMutating ? 'Enregistrement...' : selectedId ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {/* 1. Informations générales */}
      <Card variant="glass">
        <h3 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
          <FiFileText className="w-5 h-5" /> Informations générales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">N° Ordre de mission *</label>
            <input type="text" value={form.numero} onChange={(e) => updateField('numero', e.target.value)}
              placeholder="Ex: 33/FANAJAVA VIII /004/SGD/2026"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Date *</label>
            <input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)}
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Bateau *</label>
            <input type="text" value={form.bateauNom} onChange={(e) => updateField('bateauNom', e.target.value)}
              placeholder="Nom du bateau"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Type de bateau *</label>
            <select value={form.bateauType} onChange={(e) => updateField('bateauType', e.target.value)}
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm">
              <option value="">Sélectionner...</option>
              {TYPE_BATEAUX.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-theme-secondary mb-1">Objet de la mission *</label>
            <input type="text" value={form.objetMission} onChange={(e) => updateField('objetMission', e.target.value)}
              placeholder="Ex: Mission de pêche dans le sud de Madagascar"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Destination *</label>
            <input type="text" value={form.destination} onChange={(e) => updateField('destination', e.target.value)}
              placeholder="Ex: Toliara, Fort Dauphin..."
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Chef de mission *</label>
            <input type="text" value={form.chefMission} onChange={(e) => updateField('chefMission', e.target.value)}
              placeholder="Nom du chef de mission"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Capitaine *</label>
            <input type="text" value={form.capitaine} onChange={(e) => updateField('capitaine', e.target.value)}
              placeholder="Nom du capitaine"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
        </div>
      </Card>

      {/* 2. Dates / Heures */}
      <Card variant="glass">
        <h3 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
          <FiRotateCcw className="w-5 h-5" /> Dates et heures de mission
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Date départ *</label>
            <input type="datetime-local" value={form.dateDepart} onChange={(e) => updateField('dateDepart', e.target.value)}
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Date arrivée *</label>
            <input type="datetime-local" value={form.dateArrivee} onChange={(e) => updateField('dateArrivee', e.target.value)}
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Heure départ</label>
            <input type="time" value={form.heureDepart} onChange={(e) => updateField('heureDepart', e.target.value)}
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Heure arrivée</label>
            <input type="time" value={form.heureArrivee} onChange={(e) => updateField('heureArrivee', e.target.value)}
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
        </div>
      </Card>

      {/* 3. Vidange / Graissage */}
      <Card variant="glass">
        <h3 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
          <FiRotateCcw className="w-5 h-5" /> Vidange / Graissage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Date vidange</label>
            <input type="date" value={form.vidangeDate} onChange={(e) => updateField('vidangeDate', e.target.value)}
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Total (Heures)</label>
            <input type="number" step="1" min="0" value={form.vidangeTotal} onChange={(e) => updateField('vidangeTotal', e.target.value)}
              placeholder="Ex: 1200"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Prochaine vidange (H)</label>
            <input type="number" step="1" min="0" value={form.vidangeProchaine} onChange={(e) => updateField('vidangeProchaine', e.target.value)}
              placeholder="Auto: Total + 150H"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm bg-accent/5" />
            <p className="text-[10px] text-theme-muted mt-1">* Auto-calculé (Total + 150H)</p>
          </div>
        </div>
      </Card>

      {/* 4. Carburant */}
      <Card variant="glass">
        <h3 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
          <FiDroplet className="w-5 h-5" /> Carburant (Litres)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Stock restant</label>
            <input type="number" step="1" min="0" value={form.carburantRestant} onChange={(e) => updateField('carburantRestant', e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Remplissage</label>
            <input type="number" step="1" min="0" value={form.carburantRemplissage} onChange={(e) => updateField('carburantRemplissage', e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Stock départ</label>
            <input type="number" step="1" min="0" value={form.carburantDepart} readOnly
              className="w-full px-4 py-2.5 border border-accent/30 rounded-lg outline-none text-sm bg-accent/5 font-bold text-accent" />
            <p className="text-[10px] text-theme-muted mt-1">* Auto-calculé</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Consommation</label>
            <input type="number" step="1" min="0" value={form.carburantConsommation} readOnly
              className="w-full px-4 py-2.5 border border-warning/30 rounded-lg outline-none text-sm bg-warning/5 font-bold text-warning" />
            <p className="text-[10px] text-theme-muted mt-1">* Auto-calculé</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Stock arrivée</label>
            <input type="number" step="1" min="0" value={form.carburantArrivee} onChange={(e) => updateField('carburantArrivee', e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
          </div>
        </div>
      </Card>

      {/* 5. Équipage / Indemnités */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-accent flex items-center gap-2">
            <FiUsers className="w-5 h-5" /> Équipage / Indemnités
          </h3>
          <Button variant="secondary" size="sm" onClick={addEquipageMember} className="flex items-center gap-1">
            <FiPlus className="w-3 h-3" /> Ajouter membre
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-theme-surface border-b border-theme">
                <th className="text-left px-3 py-2 text-theme-tertiary font-semibold">Nom & Prénom</th>
                <th className="text-left px-3 py-2 text-theme-tertiary font-semibold">Fonction</th>
                <th className="text-right px-3 py-2 text-theme-tertiary font-semibold">Mt Unitaire (Ar)</th>
                <th className="text-center px-3 py-2 text-theme-tertiary font-semibold">Nb Jours</th>
                <th className="text-right px-3 py-2 text-theme-tertiary font-semibold">Total (Ar)</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle">
              {form.equipage.map((m, i) => (
                <tr key={i} className="hover:bg-theme-card">
                  <td className="px-3 py-2">
                    <input type="text" value={m.nom} onChange={(e) => updateEquipage(i, 'nom', e.target.value)}
                      placeholder="Nom du membre" className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" value={m.fonction} onChange={(e) => updateEquipage(i, 'fonction', e.target.value)}
                      placeholder="Fonction" className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="100" min="0" value={m.montantUnitaire} onChange={(e) => updateEquipage(i, 'montantUnitaire', e.target.value)}
                      placeholder="0" className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min="1" value={m.nombreJours} onChange={(e) => updateEquipage(i, 'nombreJours', e.target.value)}
                      className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-accent">
                    {(parseFloat(m.montantUnitaire) * parseInt(m.nombreJours) || 0).toLocaleString('fr-MG')}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeEquipageMember(i)} className="p-1 text-danger hover:bg-danger/10 rounded-lg disabled:opacity-30"
                      disabled={form.equipage.length <= 1}><FiTrash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary/5">
                <td colSpan={4} className="px-3 py-2 text-right font-bold text-primary">Total Général</td>
                <td className="px-3 py-2 text-right font-bold text-primary text-lg">{totalIndem.toLocaleString('fr-MG')} Ar</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Total en lettres */}
        {totalIndem > 0 && (
          <div className="mt-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
            <p className="text-xs text-theme-secondary font-medium mb-1">Montant en toutes lettres :</p>
            <p className="text-sm font-bold text-accent uppercase tracking-wide">{nombreEnLettres(totalIndem)}</p>
          </div>
        )}
      </Card>

      {/* 6. Marchandises */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-accent flex items-center gap-2">
            <FiPackage className="w-5 h-5" /> Marchandises à embarquer
          </h3>
          <Button variant="secondary" size="sm" onClick={addMarchandise} className="flex items-center gap-1">
            <FiPlus className="w-3 h-3" /> Ajouter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-theme-surface border-b border-theme">
                <th className="text-left px-3 py-2 text-theme-tertiary font-semibold">Désignation</th>
                <th className="text-right px-3 py-2 text-theme-tertiary font-semibold">Quantité</th>
                <th className="text-center px-3 py-2 text-theme-tertiary font-semibold">Unité</th>
                <th className="text-left px-3 py-2 text-theme-tertiary font-semibold">Observation</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle">
              {form.marchandises.map((m, i) => (
                <tr key={i} className="hover:bg-theme-card">
                  <td className="px-3 py-2">
                    <input type="text" value={m.designation} onChange={(e) => updateMarchandise(i, 'designation', e.target.value)}
                      placeholder="Désignation de la marchandise"
                      className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.01" min="0" value={m.quantite} onChange={(e) => updateMarchandise(i, 'quantite', e.target.value)}
                      placeholder="0" className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" value={m.unite} onChange={(e) => updateMarchandise(i, 'unite', e.target.value)}
                      placeholder="Kg, L, ..." className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" value={m.observation} onChange={(e) => updateMarchandise(i, 'observation', e.target.value)}
                      placeholder="Optionnelle"
                      className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeMarchandise(i)} className="p-1 text-danger hover:bg-danger/10 rounded-lg disabled:opacity-30"
                      disabled={form.marchandises.length <= 1}><FiTrash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 7. Passagers */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-accent flex items-center gap-2">
            <FiUsers className="w-5 h-5" /> Passagers
          </h3>
          <Button variant="secondary" size="sm" onClick={addPassager} className="flex items-center gap-1">
            <FiPlus className="w-3 h-3" /> Ajouter passager
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-theme-surface border-b border-theme">
                <th className="text-left px-3 py-2 text-theme-tertiary font-semibold">Nom & Prénom</th>
                <th className="text-left px-3 py-2 text-theme-tertiary font-semibold">N° CIN</th>
                <th className="text-left px-3 py-2 text-theme-tertiary font-semibold">Fonction</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle">
              {form.passagers.map((p, i) => (
                <tr key={i} className="hover:bg-theme-card">
                  <td className="px-3 py-2">
                    <input type="text" value={p.nom} onChange={(e) => updatePassager(i, 'nom', e.target.value)}
                      placeholder="Nom du passager"
                      className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" value={p.cin} onChange={(e) => updatePassager(i, 'cin', e.target.value)}
                      placeholder="N° CIN"
                      className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" value={p.fonction} onChange={(e) => updatePassager(i, 'fonction', e.target.value)}
                      placeholder="Fonction"
                      className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removePassager(i)} className="p-1 text-danger hover:bg-danger/10 rounded-lg disabled:opacity-30"
                      disabled={form.passagers.length <= 1}><FiTrash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 8. Divers Frais */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-accent flex items-center gap-2">
            <FiDroplet className="w-5 h-5" /> Divers Frais
          </h3>
          <Button variant="secondary" size="sm" onClick={addDiversFrais} className="flex items-center gap-1">
            <FiPlus className="w-3 h-3" /> Ajouter un frais
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-theme-surface border-b border-theme">
                <th className="text-left px-3 py-2 text-theme-tertiary font-semibold">Désignation</th>
                <th className="text-right px-3 py-2 text-theme-tertiary font-semibold">Montant (Ar)</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle">
              {form.diversFrais.map((d, i) => (
                <tr key={i} className="hover:bg-theme-card">
                  <td className="px-3 py-2">
                    <input type="text" value={d.designation} onChange={(e) => updateDiversFrais(i, 'designation', e.target.value)}
                      placeholder="Désignation du frais"
                      className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="100" min="0" value={d.montant} onChange={(e) => updateDiversFrais(i, 'montant', e.target.value)}
                      placeholder="0" className="w-full px-2 py-1.5 border border-theme-subtle rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-accent" />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeDiversFrais(i)} className="p-1 text-danger hover:bg-danger/10 rounded-lg disabled:opacity-30"
                      disabled={form.diversFrais.length <= 1}><FiTrash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary/5">
                <td className="px-3 py-2 text-right font-bold text-primary">Total Divers Frais</td>
                <td className="px-3 py-2 text-right font-bold text-primary">
                  {form.diversFrais.reduce((s, d) => s + (parseFloat(d.montant) || 0), 0).toLocaleString('fr-MG')} Ar
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* 9. Heures de parcours (calcul auto) */}
      {form.dateDepart && form.dateArrivee && (() => {
        const duree = calculerHeuresParcours(form.dateDepart, form.dateArrivee)
        if (!duree) return null
        return (
          <Card variant="glass" className="!p-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-accent/10 rounded-xl"><FiRotateCcw className="w-5 h-5 text-accent" /></div>
              <div>
                <p className="text-xs text-theme-secondary font-medium">Durée de la mission (calculée automatiquement)</p>
                <p className="text-xl font-bold text-accent">{duree.heures}h {duree.minutes}min <span className="text-sm text-theme-tertiary font-normal">(soit {duree.totalHeures} heures)</span></p>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* Bouton de sauvegarde flottant */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button onClick={handleSave} disabled={isMutating} size="lg" className="shadow-2xl shadow-primary/30 flex items-center gap-3 px-8">
          <FiSave className="w-5 h-5" />
          {isMutating ? 'Génération...' : selectedId ? 'Mettre à jour' : 'Générer l\'ordre de mission'}
        </Button>
      </div>
    </div>
  )
}
