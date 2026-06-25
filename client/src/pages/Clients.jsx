import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getClients, createClient, updateClient, deleteClient } from '../services/clientService'
import { getVentes } from '../services/venteService'
import { getExportations } from '../services/exportationService'
import { getAchats } from '../services/achatService'
import { FiUsers, FiPlus, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiEdit2, FiMail, FiPhone, FiMapPin, FiUser, FiDollarSign, FiShoppingCart, FiGlobe, FiCalendar } from 'react-icons/fi'
import { formatCurrency } from '../utils/format'
import toast from 'react-hot-toast'

const TYPES_CLIENTS = ['Particulier', 'Restaurant', 'Poissonnerie', 'Grossiste', 'Supermarche', 'Association', 'Collectivite']
const TYPES_COLORS = {
  Particulier: 'bg-blue-100 text-blue-700', Restaurant: 'bg-purple-100 text-purple-700',
  Poissonnerie: 'bg-success/10 text-success', Grossiste: 'bg-warning/10 text-warning',
  Supermarche: 'bg-danger/10 text-danger', Association: 'bg-accent/10 text-accent',
  Collectivite: 'bg-primary/10 text-primary'
}

const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function TypeBadge({ type }) {
  const color = TYPES_COLORS[type] || 'bg-theme-surface text-theme-tertiary'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{type}</span>
}

const emptyForm = { nom: '', email: '', telephone: '', adresse: '', type: 'Particulier', notes: '' }

export default function Clients() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sort, setSort] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [detailModal, setDetailModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const queryClient = useQueryClient()
  const limit = 20

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', page, search, typeFilter, sort],
    queryFn: () => getClients({ page, limit, search: search || undefined, type: typeFilter || undefined, sort: sort || undefined })
  })

  // Fetch ventes and exportations for the selected client
  const { data: clientVentes } = useQuery({
    queryKey: ['client-ventes', selectedClient?.id],
    queryFn: () => getVentes({ clientId: selectedClient.id, limit: 50 }),
    enabled: !!selectedClient?.id
  })

  const { data: clientExportations } = useQuery({
    queryKey: ['client-exportations', selectedClient?.id],
    queryFn: () => getExportations({ clientId: selectedClient.id, limit: 50 }),
    enabled: !!selectedClient?.id
  })

  const { data: clientAchats } = useQuery({
    queryKey: ['client-achats', selectedClient?.id],
    queryFn: () => getAchats({ clientId: selectedClient.id, limit: 50 }),
    enabled: !!selectedClient?.id
  })

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client créé')
      setModalOpen(false)
      setForm({ ...emptyForm })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client mis à jour')
      setModalOpen(false)
      setEditClient(null)
      setForm({ ...emptyForm })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client supprimé')
      setDeleteConfirm(null)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const clients = clientsData?.clients || []
  const pagination = clientsData?.pagination || { page: 1, limit, total: 0, pages: 1 }
  const stats = clientsData?.stats

  const openCreate = () => {
    setEditClient(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  const openEdit = (client) => {
    setEditClient(client)
    setForm({
      nom: client.nom,
      email: client.email || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      type: client.type,
      notes: client.notes || ''
    })
    setModalOpen(true)
  }

  const openDetail = (client) => {
    setSelectedClient(client)
    setDetailModal(true)
  }

  const handleSubmit = () => {
    if (!form.nom || !form.type) return toast.error('Nom et type requis')
    if (editClient) {
      updateMutation.mutate({ id: editClient.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl"><FiUsers className="w-7 h-7 text-primary" /></div>
            <h1 className="text-3xl font-bold text-primary">Clients</h1>
          </div>
          <p className="text-theme-secondary ml-1">{pagination.total} client(s) enregistré(s)</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2"><FiPlus className="w-4 h-4" /> Nouveau client</Button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card variant="glass" className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl"><FiUsers className="w-5 h-5 text-primary" /></div>
              <div><p className="text-xs text-theme-secondary font-medium">Total clients</p><p className="text-xl font-bold text-theme-primary">{stats.totalClients}</p></div>
            </div>
          </Card>
          <Card variant="glass" className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-success/10 rounded-xl"><FiDollarSign className="w-5 h-5 text-success" /></div>
              <div><p className="text-xs text-theme-secondary font-medium">Achats totaux</p><p className="text-xl font-bold text-theme-primary">{formatCurrency(stats.totalAchats)}</p></div>
            </div>
          </Card>
          <Card variant="glass" className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-warning/10 rounded-xl"><FiShoppingCart className="w-5 h-5 text-warning" /></div>
              <div><p className="text-xs text-theme-secondary font-medium">Types clients</p><p className="text-xl font-bold text-theme-primary">{stats.typesRepartition?.length || 0}</p></div>
            </div>
          </Card>
          <Card variant="glass" className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 rounded-xl"><FiUser className="w-5 h-5 text-accent" /></div>
              <div><p className="text-xs text-theme-secondary font-medium">Top type</p><p className="text-xl font-bold text-theme-primary truncate">
                {stats.typesRepartition?.sort((a, b) => b.count - a.count)[0]?.type || '—'}
              </p></div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card variant="glass" className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FiSearch className="w-5 h-5 text-theme-muted shrink-0" />
          <input type="text" placeholder="Rechercher par nom, email ou téléphone..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 min-w-[180px] bg-transparent border border-theme rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent text-theme-secondary placeholder-theme-muted" />
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Tous types</option>
            {TYPES_CLIENTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Tri: Récent</option>
            <option value="totalAchats">Plus d'achats</option>
            <option value="nbCommandes">Plus de commandes</option>
            <option value="nom">Nom A-Z</option>
          </select>
          {(search || typeFilter || sort) && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); setSort(''); setPage(1) }}
              className="text-sm text-accent hover:underline shrink-0">Réinitialiser</button>
          )}
        </div>
      </Card>

      {/* Types distribution bar */}
      {stats?.typesRepartition && stats.typesRepartition.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.typesRepartition.map(t => {
            const pct = ((t.count / stats.totalClients) * 100).toFixed(0)
            const color = TYPES_COLORS[t.type] || 'bg-theme-surface text-theme-tertiary'
            return (
              <span key={t.type} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${color}`}>
                {t.type}
                <span className="opacity-70">{t.count} ({pct}%)</span>
              </span>
            )
          })}
        </div>
      )}

      {/* Client Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner className="w-12 h-12" /></div>
      ) : clients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <Card key={client.id} variant="glass" className="!p-5 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all group" onClick={() => openDetail(client)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${client.type === 'Particulier' ? 'bg-blue-500' : client.type === 'Restaurant' ? 'bg-purple-500' : client.type === 'Grossiste' ? 'bg-warning' : 'bg-accent'}`}>
                    {client.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-theme-primary group-hover:text-primary transition-colors">{client.nom}</p>
                    <TypeBadge type={client.type} />
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(client) }} className="p-1.5 text-theme-muted hover:text-accent hover:bg-accent/10 rounded-lg"><FiEdit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(client.id) }} className="p-1.5 text-theme-muted hover:text-danger hover:bg-danger/10 rounded-lg"><FiTrash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-theme-tertiary">
                    <FiMail className="w-3.5 h-3.5 text-theme-muted shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.telephone && (
                  <div className="flex items-center gap-2 text-theme-tertiary">
                    <FiPhone className="w-3.5 h-3.5 text-theme-muted shrink-0" />
                    <span>{client.telephone}</span>
                  </div>
                )}
                {client.adresse && (
                  <div className="flex items-center gap-2 text-theme-tertiary">
                    <FiMapPin className="w-3.5 h-3.5 text-theme-muted shrink-0" />
                    <span className="truncate">{client.adresse}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-theme">
                <div className="flex items-center gap-1 text-sm">
                  <FiDollarSign className="w-3.5 h-3.5 text-success" />
                  <span className="font-bold text-theme-primary">{formatCurrency(client.totalAchats)}</span>
                  <span className="text-theme-muted text-xs ml-1">({client.nbCommandes} cmd.)</span>
                </div>
                <span className="text-xs text-theme-muted">{client.dernierAchat ? formatDate(client.dernierAchat) : 'Nouveau'}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FiUsers className="w-16 h-16 mx-auto text-theme-muted mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucun client</h3>
          <p className="text-theme-muted mb-6">Ajoutez votre premier client</p>
          <Button onClick={openCreate}><FiPlus className="w-4 h-4 mr-2" /> Nouveau client</Button>
        </div>
      )}

      {/* Pagination */}
      {clients.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-theme-elevated backdrop-blur-sm border border-theme rounded-xl">
          <p className="text-sm text-theme-secondary">Page {pagination.page} sur {pagination.pages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Détails du client">
        {selectedClient && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${selectedClient.type === 'Particulier' ? 'bg-blue-500' : selectedClient.type === 'Restaurant' ? 'bg-purple-500' : 'bg-accent'}`}>
                {selectedClient.nom.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold text-theme-primary">{selectedClient.nom}</p>
                <TypeBadge type={selectedClient.type} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-theme-secondary">Email</p><p className="font-semibold text-theme-primary">{selectedClient.email || '—'}</p></div>
              <div><p className="text-xs text-theme-secondary">Téléphone</p><p className="font-semibold text-theme-primary">{selectedClient.telephone || '—'}</p></div>
              <div><p className="text-xs text-theme-secondary">Adresse</p><p className="font-semibold text-theme-primary">{selectedClient.adresse || '—'}</p></div>
              <div><p className="text-xs text-theme-secondary">Total achats</p><p className="font-semibold text-theme-primary">{formatCurrency(selectedClient.totalAchats)}</p></div>
              <div><p className="text-xs text-theme-secondary">Commandes</p><p className="font-semibold text-theme-primary">{selectedClient.nbCommandes}</p></div>
              <div><p className="text-xs text-theme-secondary">Dernier achat</p><p className="font-semibold text-theme-primary">{selectedClient.dernierAchat ? formatDate(selectedClient.dernierAchat) : '—'}</p></div>
            </div>
            {selectedClient.notes && <div><p className="text-xs text-theme-secondary mb-1">Notes</p><p className="text-sm text-theme-secondary bg-theme-surface rounded-lg p-3">{selectedClient.notes}</p></div>}

            {/* ─── Historique des transactions ─── */}
            <div className="border-t border-theme pt-4">
              <h4 className="text-sm font-bold text-theme-primary mb-3 flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-accent" />
                Historique des transactions
              </h4>

              {(() => {
                const ventes = clientVentes?.ventes || []
                const exportations = clientExportations?.exportations || []
                const achats = clientAchats?.achats || []

                // Combine and sort by date desc
                const transactions = [
                  ...ventes.map(v => ({
                    id: v.id,
                    date: new Date(v.date),
                    type: 'Vente',
                    espece: v.espece,
                    montant: v.total,
                    quantite: v.quantite,
                    detail: v.typeClient,
                    statut: null
                  })),
                  ...exportations.map(e => ({
                    id: e.id,
                    date: new Date(e.date),
                    type: 'Export',
                    espece: e.espece,
                    montant: e.prixTotal,
                    quantite: e.quantite,
                    detail: e.paysDestination,
                    statut: e.statut
                  })),
                  ...achats.map(a => ({
                    id: a.id,
                    date: new Date(a.date),
                    type: 'Achat',
                    espece: a.espece,
                    montant: a.total,
                    quantite: a.quantite,
                    detail: a.fournisseur,
                    statut: null
                  }))
                ].sort((a, b) => b.date - a.date)

                if (transactions.length === 0) {
                  return <p className="text-sm text-theme-muted text-center py-6">Aucune transaction pour ce client</p>
                }

                return (
                  <div className="max-h-64 overflow-y-auto custom-scrollbar -mx-2">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-theme">
                          <th className="text-left px-2 py-2 font-semibold text-theme-tertiary text-xs">Date</th>
                          <th className="text-left px-2 py-2 font-semibold text-theme-tertiary text-xs">Type</th>
                          <th className="text-left px-2 py-2 font-semibold text-theme-tertiary text-xs">Espèce</th>
                          <th className="text-right px-2 py-2 font-semibold text-theme-tertiary text-xs">Qté</th>
                          <th className="text-right px-2 py-2 font-semibold text-theme-tertiary text-xs">Montant</th>
                          <th className="text-left px-2 py-2 font-semibold text-theme-tertiary text-xs">Détail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-subtle">
                        {transactions.map(t => (
                          <tr key={`${t.type}-${t.id}`} className="hover:bg-theme-surface/50">
                            <td className="px-2 py-2 text-theme-tertiary text-xs whitespace-nowrap">
                              {t.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-2 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                t.type === 'Vente' ? 'bg-success/10 text-success' : t.type === 'Export' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                              }`}>
                                {t.type === 'Vente' ? <FiShoppingCart className="w-3 h-3" /> : t.type === 'Export' ? <FiGlobe className="w-3 h-3" /> : <FiDollarSign className="w-3 h-3" />}
                                {t.type}
                              </span>
                            </td>
                            <td className="px-2 py-2 font-medium text-theme-primary text-xs">{t.espece}</td>
                            <td className="px-2 py-2 text-right text-theme-secondary text-xs">{formatNumber(t.quantite)} kg</td>
                            <td className="px-2 py-2 text-right font-semibold text-theme-primary text-xs">{formatCurrency(t.montant)}</td>
                            <td className="px-2 py-2 text-theme-tertiary text-xs">
                              {t.type === 'Export' ? (
                                <span className="flex items-center gap-1">
                                  <FiMapPin className="w-3 h-3" /> {t.detail}
                                </span>
                              ) : (
                                t.detail
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => { openEdit(selectedClient); setDetailModal(false) }} className="flex items-center gap-2"><FiEdit2 className="w-4 h-4" /> Modifier</Button>
              <Button variant="secondary" onClick={() => setDetailModal(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Create/Edit Modal ─── */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditClient(null); setForm({ ...emptyForm }) }}
        title={editClient ? 'Modifier le client' : 'Nouveau client'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Nom *</label>
            <input type="text" value={form.nom} onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
              className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Nom du client" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="client@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Téléphone</label>
              <input type="tel" value={form.telephone} onChange={(e) => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="+221 77 123 45 67" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Adresse</label>
            <input type="text" value={form.adresse} onChange={(e) => setForm(f => ({ ...f, adresse: e.target.value }))}
              className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Adresse complète" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Type *</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent">
                {TYPES_CLIENTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Notes optionnelles" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditClient(null); setForm({ ...emptyForm }) }}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !form.nom}
              className="flex items-center gap-2">
              <FiUser className="w-4 h-4" />
              {editClient ? (updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour') : (createMutation.isPending ? 'Création...' : 'Créer le client')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer le client">
        <p className="text-theme-tertiary mb-6">Cette action est irréversible. Les données du client seront perdues.</p>
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
