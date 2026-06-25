import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getAchats, createAchat, deleteAchat, getFournisseurs } from '../services/achatService'
import { getClients } from '../services/clientService'
import { FiShoppingCart, FiPlus, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiUser, FiZap, FiUsers } from 'react-icons/fi'
import { formatCurrency } from '../utils/format'
import toast from 'react-hot-toast'

const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

function AchatForm({ isOpen, onClose, clients }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createAchat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achats'] })
      queryClient.invalidateQueries({ queryKey: ['stocks'] }) // Real-time stock update
      toast.success('Achat enregistré et stock mis à jour')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const prixUnitaire = parseFloat(f.get('prixUnitaire'))
    const quantite = parseFloat(f.get('quantite'))
    mutation.mutate({
      fournisseur: f.get('fournisseur'),
      espece: f.get('espece'),
      quantite,
      prixUnitaire,
      clientId: f.get('clientId') || undefined,
      notes: f.get('notes') || undefined
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvel achat">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Fournisseur</label>
            <input name="fournisseur" required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="Nom du fournisseur" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Espèce</label>
            <input name="espece" required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="Thon, Sardine..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Quantité (kg)</label>
            <input name="quantite" type="number" step="0.1" min="0.1" required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Prix unitaire (Ar/kg)</label>
            <input name="prixUnitaire" type="number" step="0.01" min="0.01" required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="12.50" />
          </div>
        </div>
        {clients?.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Client (optionnel)</label>
            <select name="clientId" className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none">
              <option value="">Client anonyme</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.type})</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1">Notes (optionnel)</label>
          <textarea name="notes" rows="2" className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none" placeholder="Qualité, origine..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Enregistrement...' : 'Enregistrer l\'achat'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function AchatsLocaux() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const queryClient = useQueryClient()
  const limit = 15

  const { data: achatsData, isLoading } = useQuery({
    queryKey: ['achats', page, search],
    queryFn: () => getAchats({ page, limit, fournisseur: search || undefined, espece: search || undefined })
  })

  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: getFournisseurs
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-achats-list'],
    queryFn: () => getClients({ limit: 100, sort: 'nom' })
  })
  const clients = clientsData?.clients || []

  const deleteMutation = useMutation({
    mutationFn: deleteAchat,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['achats'] }); toast.success('Achat supprimé'); setDeleteConfirm(null) },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const achats = achatsData?.achats || []
  const pagination = achatsData?.pagination || { page: 1, limit, total: 0, pages: 1 }
  const totalDepenses = achats.reduce((s, a) => s + a.total, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Achats Locaux</h1>
          <p className="text-theme-secondary">{pagination.total} achat(s) — Total: {formatCurrency(totalDepenses)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setFormOpen(true)} className="flex items-center gap-2"><FiZap className="w-4 h-4" /> Achat Rapide</Button>
        <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)} className="flex items-center gap-2"><FiPlus className="w-4 h-4" /> Nouveau</Button>
      </div>

      {/* Fournisseurs stats */}
      {fournisseurs?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {fournisseurs.slice(0, 5).map((f, i) => (
            <Card key={i} variant="glass" className="!p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg"><FiUser className="w-3.5 h-3.5 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-theme-primary truncate">{f.nom}</p>
                  <p className="text-[10px] text-theme-secondary">{f.nbCommandes} cmd(s) — {formatCurrency(f.totalAchats)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <Card variant="glass" className="!p-4">
        <div className="flex items-center gap-3">
          <FiSearch className="w-5 h-5 text-theme-muted shrink-0" />
          <input type="text" placeholder="Rechercher par fournisseur ou espèce..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 bg-transparent border-none outline-none text-theme-secondary placeholder-theme-muted" />
          {search && <button onClick={() => { setSearch(''); setPage(1) }} className="text-sm text-accent hover:underline shrink-0">Réinitialiser</button>}
        </div>
      </Card>

      {/* Loading */}
      {isLoading && <div className="flex justify-center py-16"><div className="flex flex-col items-center gap-3"><Spinner className="w-10 h-10 border-primary" /><p className="text-theme-secondary">Chargement...</p></div></div>}

      {/* Table */}
      {!isLoading && achats.length > 0 && (
        <Card variant="glass" className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-surface border-b border-theme">
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Fournisseur</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Espèce</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Qté (kg)</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Prix unit.</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {achats.map(a => (
                  <tr key={a.id} className="hover:bg-theme-surface/50">
                    <td className="px-4 py-3 text-theme-secondary whitespace-nowrap">{formatDate(a.date)}</td>
                    <td className="px-4 py-3 font-medium text-theme-primary">{a.fournisseur}</td>
                    <td className="px-4 py-3"><span className="px-2.5 py-1 bg-success/10 text-success rounded-full text-xs font-semibold">{a.espece}</span></td>
                    <td className="px-4 py-3 text-right text-theme-secondary">{formatNumber(a.quantite)}</td>
                    <td className="px-4 py-3 text-right text-theme-secondary">{formatCurrency(a.prixUnitaire)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-theme-primary">{formatCurrency(a.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg" title="Supprimer"><FiTrash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme bg-theme-surface/50">
            <p className="text-sm text-theme-secondary">Page {pagination.page} sur {pagination.pages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </Card>
      )}

      {!isLoading && achats.length === 0 && (
        <div className="text-center py-16">
          <FiShoppingCart className="w-16 h-16 mx-auto text-theme-tertiary mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucun achat</h3>
          <p className="text-theme-muted mb-6">Enregistrez votre premier achat local</p>
          <Button variant="primary" onClick={() => setFormOpen(true)} className="flex items-center gap-2 mx-auto"><FiZap className="w-4 h-4" /> Achat Rapide</Button>
        </div>
      )}

      <AchatForm isOpen={formOpen} onClose={() => setFormOpen(false)} clients={clients} />
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer l'achat">
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
