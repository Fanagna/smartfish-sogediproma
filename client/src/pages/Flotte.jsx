import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getBateaux, createBateau, updateBateau, deleteBateau, utiliserCarburant, remplirCarburant } from '../services/bateauService'
import { getPredictionsMaintenance } from '../services/iaService'
import { getRavitaillements, createRavitaillement, deleteRavitaillement } from '../services/ravitaillementService'
import { FiAnchor, FiPlus, FiEdit2, FiTrash2, FiDroplet, FiUsers, FiNavigation, FiSettings, FiCalendar, FiAlertTriangle, FiCheckCircle, FiClock, FiDollarSign, FiTruck, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const TYPE_BATEAUX = ['Pêche côtière', 'Pêche hauturière', 'Thonier', 'Chalutier', 'Palangrier', 'Fileyeur', 'Caseyeur', 'Dragueur', 'Senneur', 'Polyvalent']

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function FuelBar({ current, capacity }) {
  const ratio = capacity > 0 ? current / capacity : 0
  const color = ratio > 0.5 ? 'bg-success' : ratio > 0.25 ? 'bg-warning' : 'bg-danger'
  const isCritique = ratio <= 0.15
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-theme-surface rounded-full h-2.5 overflow-hidden relative">
        <div className={`h-full rounded-full transition-all duration-500 ${color} ${isCritique ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
        {isCritique && <div className="absolute inset-0 bg-danger/20 rounded-full animate-ping" />}
      </div>
      <span className={`text-xs font-bold min-w-[60px] text-right ${isCritique ? 'text-danger' : 'text-theme-tertiary'}`}>
        {current.toFixed(0)}L / {capacity}L
      </span>
    </div>
  )
}

// Map des consommations horaires par type de bateau (L/h) — fallback si consoHoraire non renseignée
const CONSO_PAR_TYPE = {
  'Pêche côtière': 15, 'Pêche hauturière': 60, 'Thonier': 120, 'Chalutier': 90,
  'Palangrier': 40, 'Fileyeur': 25, 'Caseyeur': 20, 'Drageur': 70, 'Senneur': 100, 'Polyvalent': 50
}

function getConso(consoHoraire, type) {
  if (consoHoraire != null && consoHoraire > 0) return consoHoraire
  return CONSO_PAR_TYPE[type] || 35
}

function AutonomieBadge({ restant, type, consoHoraire }) {
  const r = restant || 0
  const conso = getConso(consoHoraire, type)
  const heures = conso > 0 ? r / conso : 0
  if (heures <= 0) return <span className="text-xs text-theme-tertiary">—</span>
  const heuresArr = Math.floor(heures)
  const minutesArr = Math.round((heures % 1) * 60)
  const color = heures < 2 ? 'text-danger' : heures < 6 ? 'text-warning' : 'text-success'
  return (
    <span className={`text-xs font-bold ${color}`}>
      ~{heuresArr}h{minutesArr > 0 ? `${minutesArr}` : ''}
    </span>
  )
}

function CoutEstime({ restant, capacity, type, consoHoraire }) {
  const cap = capacity || 500
  const rest = restant || 0
  const conso = getConso(consoHoraire, type)
  const carburantConsomme = Math.max(0, cap - rest)
  const heuresMer = conso > 0 ? carburantConsomme / conso : 0
  const coutCarburant = carburantConsomme * 4800
  const coutMaintenance = coutCarburant * 0.15
  const coutEquipage = Math.max(0, heuresMer) * 2000
  const total = coutCarburant + coutMaintenance + coutEquipage
  return (
    <span className="text-xs font-bold text-theme-secondary">
      {total > 0 ? `${(total / 1000).toFixed(0)}k Ar` : '—'}
    </span>
  )
}

function RavitaillementModal({ isOpen, onClose, bateau }) {
  const queryClient = useQueryClient()
  const [litres, setLitres] = useState('')
  const [prixLitre, setPrixLitre] = useState('4800')
  const [fournisseur, setFournisseur] = useState('')
  const [notes, setNotes] = useState('')

  const { data: ravitData, isLoading: loadingHisto } = useQuery({
    queryKey: ['ravitaillements', bateau?.id],
    queryFn: () => getRavitaillements(bateau.id),
    enabled: isOpen && !!bateau?.id
  })

  const createMut = useMutation({
    mutationFn: createRavitaillement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ravitaillements', bateau?.id] })
      queryClient.invalidateQueries({ queryKey: ['bateaux'] })
      toast.success('Ravitaillement enregistré')
      setLitres(''); setPrixLitre('4800'); setFournisseur(''); setNotes('')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const deleteMut = useMutation({
    mutationFn: deleteRavitaillement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ravitaillements', bateau?.id] })
      queryClient.invalidateQueries({ queryKey: ['bateaux'] })
      toast.success('Ravitaillement supprimé')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const l = parseFloat(litres)
    if (l <= 0) { toast.error('Quantité invalide'); return }
    createMut.mutate({
      bateauId: bateau.id,
      litres: l,
      prixLitre: parseFloat(prixLitre) || 4800,
      fournisseur: fournisseur || undefined,
      notes: notes || undefined
    })
  }

  const ravitaillements = ravitData?.ravitaillements || []
  const stats = ravitData?.stats

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ravitaillement — ${bateau?.nom || ''}`} className="max-w-2xl">
      <div className="space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-theme-surface">
              <p className="text-[10px] text-theme-tertiary uppercase tracking-wider">Total ravitaillements</p>
              <p className="text-xl font-bold text-primary">{stats.totalRavitaillements}</p>
            </div>
            <div className="p-3 rounded-xl bg-theme-surface">
              <p className="text-[10px] text-theme-tertiary uppercase tracking-wider">Total litres</p>
              <p className="text-xl font-bold text-accent">{stats.totalLitres.toFixed(0)} L</p>
            </div>
            <div className="p-3 rounded-xl bg-theme-surface">
              <p className="text-[10px] text-theme-tertiary uppercase tracking-wider">Coût total</p>
              <p className="text-xl font-bold text-warning">{stats.totalCout > 0 ? `${(stats.totalCout / 1000).toFixed(0)}k Ar` : '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-theme-surface">
              <p className="text-[10px] text-theme-tertiary uppercase tracking-wider">Prix moyen/L</p>
              <p className="text-xl font-bold text-theme-primary">{stats.coutMoyenLitre > 0 ? `${stats.coutMoyenLitre.toFixed(0)} Ar` : '—'}</p>
            </div>
          </div>
        )}

        {/* Formulaire ajout */}
        <form onSubmit={handleSubmit} className="bg-theme-surface rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm text-theme-primary">Nouveau ravitaillement</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Litres</label>
              <input type="number" step="1" min="1" required value={litres} onChange={e => setLitres(e.target.value)}
                className="w-full px-3 py-2 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" placeholder="100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Prix/L (Ar)</label>
              <input type="number" step="10" min="1" value={prixLitre} onChange={e => setPrixLitre(e.target.value)}
                className="w-full px-3 py-2 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Fournisseur</label>
              <input type="text" value={fournisseur} onChange={e => setFournisseur(e.target.value)}
                className="w-full px-3 py-2 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" placeholder="GALANA, JIRAMA..." />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? '...' : 'Ajouter'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" placeholder="Optionnel" />
          </div>
        </form>

        {/* Historique */}
        <div>
          <h4 className="font-semibold text-sm text-theme-primary mb-3">Historique des ravitaillements</h4>
          {loadingHisto ? (
            <div className="flex justify-center py-6"><Spinner className="w-6 h-6" /></div>
          ) : ravitaillements.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {ravitaillements.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-theme-surface hover:bg-theme-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <FiDroplet className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-theme-primary">{r.litres} L <span className="text-theme-tertiary font-normal">× {r.prixLitre} Ar/L</span></p>
                      <p className="text-xs text-theme-secondary">{formatDate(r.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-warning">{(r.coutTotal / 1000).toFixed(0)}k Ar</p>
                      {r.fournisseur && <p className="text-[10px] text-theme-tertiary">{r.fournisseur}</p>}
                    </div>
                    <button onClick={() => { if (confirm('Supprimer ce ravitaillement ?')) deleteMut.mutate(r.id) }}
                      className="p-1.5 text-danger/60 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-theme-tertiary">
              <FiTruck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucun ravitaillement enregistré</p>
              <p className="text-xs mt-1">Ajoutez votre premier ravitaillement ci-dessus</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function BateauFormModal({ isOpen, onClose, bateau, capitaines = [] }) {
  const queryClient = useQueryClient()
  const isEditing = !!bateau
  const createMutation = useMutation({
    mutationFn: createBateau,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bateaux'] }); toast.success('Bateau ajouté'); onClose() },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })
  const updateMutation = useMutation({
    mutationFn: (data) => updateBateau(bateau.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bateaux'] }); toast.success('Bateau mis à jour'); onClose() },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const consoVal = f.get('consoHoraire')
    const data = {
      nom: f.get('nom'), immatriculation: f.get('immatriculation'), type: f.get('type'),
      longueur: parseFloat(f.get('longueur')),
      carburantCapacity: parseFloat(f.get('carburantCapacity')) || 500,
      consoHoraire: consoVal ? parseFloat(consoVal) : null,
      capitaineId: parseInt(f.get('capitaineId'))
    }
    if (isEditing) updateMutation.mutate(data); else createMutation.mutate(data)
  }
  const isMutating = createMutation.isPending || updateMutation.isPending
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Modifier le bateau' : 'Ajouter un bateau'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-theme-secondary mb-1">Nom</label><input name="nom" defaultValue={bateau?.nom || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="Nom du bateau" /></div>
          <div><label className="block text-sm font-medium text-theme-secondary mb-1">Immatriculation</label><input name="immatriculation" defaultValue={bateau?.immatriculation || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="EX-1234" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-theme-secondary mb-1">Type</label>
            <select name="type" defaultValue={bateau?.type || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none">
              <option value="">Sélectionner...</option>{TYPE_BATEAUX.map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-theme-secondary mb-1">Longueur (m)</label><input name="longueur" type="number" step="0.1" min="0" defaultValue={bateau?.longueur || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="12.5" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-theme-secondary mb-1">Capacité carburant (L)</label><input name="carburantCapacity" type="number" step="1" min="0" defaultValue={bateau?.carburantCapacity || 500} className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" /></div>
          <div><label className="block text-sm font-medium text-theme-secondary mb-1">Conso horaire (L/h) <span className="text-theme-muted font-normal">réelle</span></label>
            <input name="consoHoraire" type="number" step="1" min="0" defaultValue={bateau?.consoHoraire || ''} placeholder="Ex: 40" className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" />
            <p className="text-[10px] text-theme-tertiary mt-0.5">Laissez vide pour estimation automatique</p>
          </div>
          <div><label className="block text-sm font-medium text-theme-secondary mb-1">Capitaine</label>
            <select name="capitaineId" defaultValue={bateau?.capitaineId || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none">
              <option value="">Sélectionner...</option>{capitaines.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
            </select></div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={isMutating}>{isMutating ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Ajouter le bateau'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function FuelModal({ isOpen, onClose, bateau, action }) {
  const queryClient = useQueryClient()
  const isRefill = action === 'refill'
  const mutation = useMutation({
    mutationFn: (q) => isRefill ? remplirCarburant(bateau.id, q) : utiliserCarburant(bateau.id, q),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bateaux'] }); toast.success(isRefill ? 'Carburant ajouté' : 'Carburant utilisé'); onClose() },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    const q = parseFloat(new FormData(e.target).get('quantite'))
    if (q <= 0) { toast.error('Quantité invalide'); return }
    mutation.mutate(q)
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isRefill ? 'Remplir le carburant' : 'Utiliser du carburant'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-theme-surface rounded-xl p-4 space-y-2">
          <p className="text-sm text-theme-tertiary"><span className="font-medium">{bateau?.nom}</span> — {bateau?.immatriculation}</p>
          <p className="text-sm text-theme-tertiary">Carburant : <span className="font-bold">{bateau?.carburantRestant?.toFixed(0)}L</span> / {bateau?.carburantCapacity}L</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1">Quantité (L) — {isRefill ? 'à ajouter' : 'à consommer'}</label>
          <input name="quantite" type="number" step="1" min="1" max={isRefill ? bateau?.carburantCapacity - bateau?.carburantRestant : bateau?.carburantRestant} required
            className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="50" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Traitement...' : isRefill ? 'Remplir' : 'Utiliser'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Flotte() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBateau, setEditingBateau] = useState(null)
  const [fuelModalOpen, setFuelModalOpen] = useState(false)
  const [fuelBateau, setFuelBateau] = useState(null)
  const [fuelAction, setFuelAction] = useState('refill')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [ravitaillementModalOpen, setRavitaillementModalOpen] = useState(false)
  const [ravitaillementBateau, setRavitaillementBateau] = useState(null)
  const queryClient = useQueryClient()

  const { data: bateaux, isLoading, isError, error } = useQuery({
    queryKey: ['bateaux'],
    queryFn: getBateaux
  })

  // Maintenance data
  const { data: maintenances } = useQuery({
    queryKey: ['maintenances'],
    queryFn: getPredictionsMaintenance,
    enabled: showMaintenance,
    retry: false
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBateau,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bateaux'] }); toast.success('Bateau supprimé'); setDeleteConfirm(null) },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4"><Spinner className="w-12 h-12 border-primary" /><p className="text-theme-tertiary">Chargement de la flotte...</p></div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center"><p className="text-xl font-bold text-danger mb-2">Erreur de chargement</p><p className="text-theme-tertiary">{error?.message}</p></div>
      </div>
    )
  }

  const capitaines = bateaux?.filter(b => b.capitaine).map(b => b.capitaine) || []
  const uniqueCapitaines = capitaines.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)
  const maintenancesList = maintenances?.predictions || []

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Gestion de la Flotte</h1>
          <p className="text-theme-secondary">{bateaux?.length || 0} bateau(x) — {maintenancesList.length} maintenance(s) prévue(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowMaintenance(!showMaintenance)} className="flex items-center gap-2">
            <FiSettings className="w-4 h-4" />
            {showMaintenance ? 'Masquer maintenance' : 'Maintenance'}
          </Button>
          <Button onClick={() => { setEditingBateau(null); setModalOpen(true) }} className="flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Ajouter un bateau
          </Button>
        </div>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl"><FiAnchor className="w-5 h-5 text-primary" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Total bateaux</p><p className="text-2xl font-bold text-primary">{bateaux?.length || 0}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiDroplet className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Carburant moyen</p><p className="text-2xl font-bold text-success">{bateaux?.length > 0 ? `${(bateaux.reduce((s, b) => s + (b.carburantRestant / b.carburantCapacity) * 100, 0) / bateaux.length).toFixed(0)}%` : '—'}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiSettings className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Maintenance prévue</p><p className="text-2xl font-bold text-accent">{maintenancesList.length}</p></div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiUsers className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-theme-secondary font-medium">Capitaines</p><p className="text-2xl font-bold text-warning">{uniqueCapitaines.length}</p></div>
          </div>
        </Card>
      </div>

      {/* Maintenance Section */}
      {showMaintenance && (
        <Card variant="glass">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl"><FiSettings className="w-5 h-5 text-purple-500" /></div>
            <div><h3 className="text-lg font-bold text-theme-primary">Planning Maintenance Prédictive</h3><p className="text-xs text-theme-secondary">Recommandations IA</p></div>
          </div>
          {maintenancesList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {maintenancesList.map((m, i) => {
                const bateau = bateaux?.find(b => b.id === m.bateauId)
                const isUrgent = m.priorite === 'HAUTE' || m.priorite === 'haute'
                return (
                  <div key={i} className={`p-4 rounded-2xl border transition-all hover:shadow-lg ${isUrgent ? 'bg-danger/5 border-danger/20' : 'bg-theme-surface border-theme'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isUrgent ? 'bg-danger/20' : 'bg-purple-500/20'}`}>
                          {isUrgent ? <FiAlertTriangle className="w-4 h-4 text-danger" /> : <FiSettings className="w-4 h-4 text-purple-500" />}
                        </div>
                        <div>
                          <p className="font-semibold text-theme-primary text-sm">{bateau?.nom || `Bateau #${m.bateauId}`}</p>
                          <p className="text-xs text-theme-secondary">{m.type || 'Maintenance'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isUrgent ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent'}`}>
                        {m.priorite}
                      </span>
                    </div>
                    <p className="text-xs text-theme-tertiary mt-2">{m.raison || m.description || 'Maintenance préventive'}</p>
                    {m.dateEstimee && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-theme-secondary">
                        <FiCalendar className="w-3 h-3" />
                        <span>Prévue le {formatDate(m.dateEstimee)}</span>
                      </div>
                    )}
                    <div className="mt-3 w-full bg-theme-surface rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${isUrgent ? 'bg-danger' : 'bg-accent'}`}
                        style={{ width: `${isUrgent ? 80 : 40}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCheckCircle className="w-10 h-10 mx-auto text-success mb-2" />
              <p className="text-sm text-theme-muted">Aucune maintenance prévue pour le moment</p>
              <p className="text-xs text-theme-muted mt-1">L'IA analyse les données pour prédire les maintenances nécessaires</p>
            </div>
          )}
        </Card>
      )}

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {bateaux?.map(bateau => {
          const bateauMaintenances = maintenancesList.filter(m => m.bateauId === bateau.id)
          return (
            <Card key={bateau.id} variant="glass" className="group hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-theme-primary">{bateau.nom}</h3>
                  <p className="text-sm text-theme-secondary">{bateau.immatriculation}</p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">{bateau.type}</span>
              </div>

              <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg" style={{backgroundColor:'var(--bg-surface)'}}>
              <p className="text-xs text-theme-tertiary">Longueur</p>
              <p className="font-semibold text-theme-secondary text-sm">{bateau.longueur} m</p>
            </div>
            <div className="p-2 rounded-lg" style={{backgroundColor:'var(--bg-surface)'}}>
              <p className="text-xs text-theme-tertiary">Capitaine</p>
              <p className="font-semibold text-theme-secondary text-sm truncate">{bateau.capitaine ? `${bateau.capitaine.prenom} ${bateau.capitaine.nom?.slice(0, 12)}` : '—'}</p>
            </div>
            <div className="p-2 rounded-lg" style={{backgroundColor:'var(--bg-surface)'}}>
              <div className="flex items-center gap-1">
                <FiClock className="w-3 h-3 text-theme-tertiary" />
                <p className="text-xs text-theme-tertiary">Autonomie</p>
              </div>
              <AutonomieBadge restant={bateau.carburantRestant} type={bateau.type} consoHoraire={bateau.consoHoraire} />
              <p className="text-[10px] text-theme-tertiary mt-0.5">{bateau.consoHoraire ? `${bateau.consoHoraire} L/h` : '— L/h'}</p>
            </div>
            <div className="p-2 rounded-lg" style={{backgroundColor:'var(--bg-surface)'}}>
              <div className="flex items-center gap-1">
                <FiDollarSign className="w-3 h-3 text-theme-tertiary" />
                <p className="text-xs text-theme-tertiary">Coût sortie</p>
              </div>
              <CoutEstime restant={bateau.carburantRestant} capacity={bateau.carburantCapacity} type={bateau.type} consoHoraire={bateau.consoHoraire} />
            </div>
          </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-theme-secondary">Carburant</span>
                    <span className={`text-xs font-bold ${bateau.carburantRestant / bateau.carburantCapacity > 0.25 ? 'text-success' : 'text-danger'}`}>
                      {((bateau.carburantRestant / bateau.carburantCapacity) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <FuelBar current={bateau.carburantRestant} capacity={bateau.carburantCapacity} />
                </div>

                {/* Maintenance indicator */}
                {bateauMaintenances.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <FiAlertTriangle className="w-3 h-3 text-warning" />
                    <span className="text-warning font-medium">{bateauMaintenances.length} maintenance(s) prévue(s)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-theme pt-4">
                <button onClick={() => { setFuelBateau(bateau); setFuelAction('refill'); setFuelModalOpen(true) }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors text-sm font-medium">
                  <FiDroplet className="w-4 h-4" /> Remplir
                </button>
                <button onClick={() => { setFuelBateau(bateau); setFuelAction('use'); setFuelModalOpen(true) }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors text-sm font-medium">
                  <FiDroplet className="w-4 h-4" /> Utiliser
                </button>
                <button onClick={() => { setRavitaillementBateau(bateau); setRavitaillementModalOpen(true) }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium">
                  <FiTruck className="w-4 h-4" /> Ravit.
                </button>
                <button onClick={() => { setEditingBateau(bateau); setModalOpen(true) }} className="p-2 text-accent hover:bg-accent/10 rounded-lg" title="Modifier">
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirm(bateau.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg" title="Supprimer">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {(!bateaux || bateaux.length === 0) && (
        <div className="text-center py-16">
          <FiAnchor className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucun bateau</h3>
          <p className="text-theme-muted mb-6">Commencez par ajouter un bateau à la flotte</p>
          <Button onClick={() => { setEditingBateau(null); setModalOpen(true) }} className="flex items-center gap-2 mx-auto"><FiPlus className="w-4 h-4" /> Ajouter un bateau</Button>
        </div>
      )}

      {/* Modals */}
      <BateauFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingBateau(null) }} bateau={editingBateau} capitaines={uniqueCapitaines} />
      <FuelModal isOpen={fuelModalOpen} onClose={() => { setFuelModalOpen(false); setFuelBateau(null) }} bateau={fuelBateau} action={fuelAction} />
      {ravitaillementBateau && (
        <RavitaillementModal isOpen={ravitaillementModalOpen} onClose={() => { setRavitaillementModalOpen(false); setRavitaillementBateau(null) }} bateau={ravitaillementBateau} />
      )}
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
