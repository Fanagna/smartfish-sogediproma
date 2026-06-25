import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getExportations, createExportation, deleteExportation, updateExportationStatut } from '../services/exportationService'
import { getCurrentStock } from '../services/stockService'
import { getClients } from '../services/clientService'
import { FiGlobe, FiPlus, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiDollarSign, FiPackage, FiMapPin, FiCheckCircle, FiZap, FiUsers, FiExternalLink } from 'react-icons/fi'
import ExportButton from '../components/ui/ExportButton'
import { exportExportationsReport } from '../utils/exportUtils'
import toast from 'react-hot-toast'

const STATUTS_EXPORT = { EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-700' }, EXPEDIE: { label: 'Expédié', color: 'bg-purple-100 text-purple-700' }, LIVRE: { label: 'Livré', color: 'bg-success/10 text-success' }, ANNULE: { label: 'Annulé', color: 'bg-danger/10 text-danger' } }
const PAYS_DESTINATION = ['France', 'Espagne', 'Italie', 'Portugal', 'Allemagne', 'Belgique', 'Pays-Bas', 'Royaume-Uni', 'Suisse', 'Japon', 'États-Unis', 'Canada', 'Chine', 'Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Côte d\'Ivoire']

const formatCurrency = (v) => v != null && !isNaN(v) ? `${Number(v).toLocaleString('fr-MG')} Ar` : '— Ar'
const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

function StatutBadge({ statut }) {
  const s = STATUTS_EXPORT[statut] || { label: statut, color: 'bg-theme-surface text-theme-tertiary' }
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>
}

function ExportStatsBar({ stats }) {
  if (!stats) return null
  const total = Object.values(stats).reduce((s, v) => s + v, 0) || 1
  const statuses = [
    { key: 'EN_COURS', color: 'bg-blue-500' },
    { key: 'EXPEDIE', color: 'bg-purple-500' },
    { key: 'LIVRE', color: 'bg-success' },
    { key: 'ANNULE', color: 'bg-gray-400' }
  ]
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden bg-theme-surface">
      {statuses.map(({ key, color }) => {
        const val = stats[key] || 0
        if (val === 0) return null
        return <div key={key} className={color} style={{ width: `${(val / total) * 100}%` }} title={`${STATUTS_EXPORT[key]?.label}: ${val}`} />
      })}
    </div>
  )
}

export default function Exportations() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [paysFilter, setPaysFilter] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedExport, setSelectedExport] = useState(null)
  const [form, setForm] = useState({ espece: '', quantite: '', paysDestination: 'France', prixTotal: '', stockId: '', clientId: '' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const limit = 15

  const { data: exportData, isLoading } = useQuery({
    queryKey: ['exportations', page, search, paysFilter, statutFilter],
    queryFn: () => getExportations({ page, limit, espece: search || undefined, pays: paysFilter || undefined, statut: statutFilter || undefined })
  })

  const { data: stocks } = useQuery({
    queryKey: ['stocks-export'],
    queryFn: getCurrentStock,
    refetchInterval: 30000
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-export-list'],
    queryFn: () => getClients({ limit: 100, sort: 'nom' })
  })
  const clients = clientsData?.clients || []

  const createMutation = useMutation({
    mutationFn: createExportation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exportations'] })
      queryClient.invalidateQueries({ queryKey: ['stocks-export'] })
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
      toast.success('Exportation créée')
      setModalOpen(false)
      setForm({ espece: '', quantite: '', paysDestination: 'France', prixTotal: '', stockId: '', clientId: '' })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExportation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exportations'] })
      queryClient.invalidateQueries({ queryKey: ['stocks-export'] })
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
      toast.success('Exportation supprimée')
      setDeleteConfirm(null)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const statutMutation = useMutation({
    mutationFn: ({ id, statut }) => updateExportationStatut(id, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exportations'] })
      toast.success('Statut mis à jour')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const exportations = exportData?.exportations || []
  const pagination = exportData?.pagination || { page: 1, limit, total: 0, pages: 1 }

  // Stats for the bar
  const allExport = exportData?.exportations || []
  const statsParStatut = {}
  allExport.forEach(e => { statsParStatut[e.statut] = (statsParStatut[e.statut] || 0) + 1 })

  const totalCA = exportations.reduce((s, e) => s + e.prixTotal, 0)
  const totalKg = exportations.reduce((s, e) => s + e.quantite, 0)

  const openDetail = (e) => {
    setSelectedExport(e)
    setDetailModal(true)
  }

  const handleStockSelect = (stockId, espece, quantiteKg) => {
    setForm(prev => ({ ...prev, stockId, espece, quantite: quantiteKg || '' }))
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl"><FiGlobe className="w-7 h-7 text-accent" /></div>
            <h1 className="text-3xl font-bold text-primary">Exportations</h1>
          </div>
          <p className="text-theme-secondary ml-1">{pagination.total} exportation(s) — CA: {formatCurrency(totalCA)} — {formatNumber(totalKg)} kg</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            onExportPDF={() => exportExportationsReport(exportations)}
            onExportExcel={async () => {
              const { exportToExcel } = await import('../utils/exportUtils')
              await exportToExcel(exportations, [
                { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('fr-FR') },
                { key: 'espece', label: 'Espèce' },
                { key: 'quantite', label: 'Qté (kg)', render: (r) => r.quantite.toFixed(1) },
                { key: 'paysDestination', label: 'Destination' },                  { key: 'prixTotal', label: 'CA (Ar)', render: (r) => `${Number(r.prixTotal).toLocaleString('fr-MG')} Ar` },
                { key: 'statut', label: 'Statut' },
              ], 'exportations', 'Exportations')
            }}
            size="sm"
          />
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="flex items-center gap-2"><FiZap className="w-4 h-4" /> Export Rapide</Button>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)} className="flex items-center gap-2"><FiPlus className="w-4 h-4" /> Nouveau</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiGlobe className="w-5 h-5 text-accent" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Exportations</p>
              <p className="text-xl font-bold text-theme-primary">{pagination.total}</p>
            </div>
          </div>
          <ExportStatsBar stats={statsParStatut} />
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl"><FiDollarSign className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">CA Total</p>
              <p className="text-xl font-bold text-theme-primary">{formatCurrency(totalCA)}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiPackage className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Volume total</p>
              <p className="text-xl font-bold text-theme-primary">{formatNumber(totalKg)} kg</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiMapPin className="w-5 h-5 text-warning" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Destinations</p>
              <p className="text-xl font-bold text-theme-primary">{new Set(exportations.map(e => e.paysDestination)).size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FiSearch className="w-5 h-5 text-theme-muted shrink-0" />
          <input type="text" placeholder="Rechercher par espèce..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 min-w-[150px] bg-transparent border border-theme rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent text-theme-secondary placeholder-theme-muted" />
          <select value={paysFilter} onChange={(e) => { setPaysFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Tous pays</option>
            {PAYS_DESTINATION.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Tous statuts</option>
            {Object.entries(STATUTS_EXPORT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(search || paysFilter || statutFilter) && (
            <button onClick={() => { setSearch(''); setPaysFilter(''); setStatutFilter(''); setPage(1) }}
              className="text-sm text-accent hover:underline shrink-0">Réinitialiser</button>
          )}
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner className="w-12 h-12" /></div>
      ) : exportations.length > 0 ? (
        <Card variant="glass" className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-surface border-b border-theme">
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Espèce</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Quantité</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">CA</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Destination</th>
              <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Client</th>
              <th className="text-center px-4 py-3 font-semibold text-theme-tertiary">Statut</th>
              <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Utilisateur</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {exportations.map(e => (
                  <tr key={e.id} className="hover:bg-theme-surface/50 cursor-pointer" onClick={() => openDetail(e)}>
                    <td className="px-4 py-3 text-theme-secondary whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-3"><span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">{e.espece}</span></td>
                    <td className="px-4 py-3 text-right text-theme-secondary">{formatNumber(e.quantite)} kg</td>
                    <td className="px-4 py-3 text-right font-semibold text-theme-primary">{formatCurrency(e.prixTotal)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-theme-secondary"><FiMapPin className="w-3 h-3 text-accent" /> {e.paysDestination}</span>
                    </td>
                    <td className="px-4 py-3">
                      {e.client ? (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); navigate('/clients') }}
                          className="flex items-center gap-1.5 text-accent hover:text-accent-dark hover:underline font-medium text-xs"
                          title="Voir la fiche client"
                        >
                          <FiUsers className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[120px]">{e.client.nom}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent whitespace-nowrap">{e.client.type}</span>
                          <FiExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                        </button>
                      ) : (
                        <span className="text-theme-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select value={e.statut} onChange={(ev) => { ev.stopPropagation(); statutMutation.mutate({ id: e.id, statut: ev.target.value }) }}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer outline-none ${STATUTS_EXPORT[e.statut]?.color || 'bg-theme-surface text-theme-tertiary'}`}>
                        {Object.entries(STATUTS_EXPORT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-theme-tertiary text-xs">{e.user ? `${e.user.prenom} ${e.user.nom}` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={(ev) => { ev.stopPropagation(); setDeleteConfirm(e.id) }} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme bg-theme-surface/50">
            <p className="text-sm text-theme-secondary">Page {pagination.page} sur {pagination.pages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="text-center py-16">
          <FiGlobe className="w-16 h-16 mx-auto text-theme-tertiary mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucune exportation</h3>
          <p className="text-theme-muted mb-6">Créez votre première exportation</p>
          <Button onClick={() => setModalOpen(true)}><FiPlus className="w-4 h-4 mr-2" /> Nouvelle exportation</Button>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Détails de l'exportation">
        {selectedExport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-theme-secondary">Date</p><p className="font-semibold text-theme-primary">{formatDateShort(selectedExport.date)}</p></div>
              <div><p className="text-xs text-theme-secondary">Statut</p><StatutBadge statut={selectedExport.statut} /></div>
              <div><p className="text-xs text-theme-secondary">Espèce</p><p className="font-semibold text-theme-primary">{selectedExport.espece}</p></div>
              <div><p className="text-xs text-theme-secondary">Quantité</p><p className="font-semibold text-theme-primary">{formatNumber(selectedExport.quantite)} kg</p></div>
              <div><p className="text-xs text-theme-secondary">Client</p><p className="font-semibold text-theme-primary">{selectedExport.client ? `${selectedExport.client.nom} (${selectedExport.client.type})` : '—'}</p></div>
              <div><p className="text-xs text-theme-secondary">Prix total</p><p className="font-semibold text-theme-primary">{formatCurrency(selectedExport.prixTotal)}</p></div>
              <div><p className="text-xs text-theme-secondary">Destination</p><p className="font-semibold text-theme-primary">{selectedExport.paysDestination}</p></div>
              <div><p className="text-xs text-theme-secondary">Prix moyen</p><p className="font-semibold text-theme-primary">{formatCurrency(selectedExport.prixTotal / selectedExport.quantite)}/kg</p></div>
              <div><p className="text-xs text-theme-secondary">Utilisateur</p><p className="font-semibold text-theme-primary">{selectedExport.user ? `${selectedExport.user.prenom} ${selectedExport.user.nom}` : '—'}</p></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              {selectedExport.statut !== 'LIVRE' && (
                <Button variant="secondary" onClick={() => { statutMutation.mutate({ id: selectedExport.id, statut: 'LIVRE' }); setDetailModal(false) }} className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4" /> Marquer livré
                </Button>
              )}
              <Button variant="secondary" onClick={() => setDetailModal(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Create Modal ─── */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setForm({ espece: '', quantite: '', paysDestination: 'France', prixTotal: '', stockId: '' }) }} title="Nouvelle exportation">
        <div className="space-y-5">
          {/* Stock selector */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">Stock à exporter (optionnel)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {stocks?.filter(s => s.quantite > 0).map(s => (
                <button key={s.id} type="button" onClick={() => handleStockSelect(s.id, s.espece, s.quantite)}
                  className={`text-left p-2.5 rounded-xl border text-sm transition-all ${form.stockId === s.id ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-theme hover:border-theme-subtle bg-theme-surface'}`}>
                  <p className="font-semibold text-theme-primary">{s.espece}</p>
                  <p className="text-xs text-theme-secondary">{formatNumber(s.quantite, 1)} {s.unite} dispo.</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Espèce</label>
              <input type="text" value={form.espece} onChange={(e) => setForm(f => ({ ...f, espece: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Thon, Espadon..." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Quantité (kg)</label>
              <input type="number" step="0.1" min="0.1" value={form.quantite} onChange={(e) => setForm(f => ({ ...f, quantite: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="100" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Pays de destination</label>
              <select value={form.paysDestination} onChange={(e) => setForm(f => ({ ...f, paysDestination: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent">
                {PAYS_DESTINATION.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Prix total (Ar)</label>
              <input type="number" step="0.01" min="0" value={form.prixTotal} onChange={(e) => setForm(f => ({ ...f, prixTotal: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="5000" required />
            </div>
          </div>

          {/* Client (optionnel) */}
          {clients?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Client (optionnel)</label>
              <select value={form.clientId} onChange={(e) => setForm(f => ({ ...f, clientId: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent">
                <option value="">Client anonyme</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.type})</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setForm({ espece: '', quantite: '', paysDestination: 'France', prixTotal: '', stockId: '', clientId: '' }) }}>Annuler</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.espece || !form.quantite || !form.prixTotal}
              className="flex items-center gap-2">
              <FiGlobe className="w-4 h-4" /> {createMutation.isPending ? 'Création...' : 'Créer l\'exportation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer l'exportation">
        <p className="text-theme-tertiary mb-6">Cette action est irréversible. Le stock sera restauré.</p>
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
