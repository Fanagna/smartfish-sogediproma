import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getVentes, createVente, deleteVente } from '../services/venteService'
import { getCurrentStock } from '../services/stockService'
import { getClients } from '../services/clientService'
import { FiShoppingCart, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiDollarSign, FiPackage, FiUser, FiFile, FiZap, FiUsers, FiExternalLink } from 'react-icons/fi'
import ExportButton from '../components/ui/ExportButton'
import { exportVentesReport } from '../utils/exportUtils'
import { formatCurrency } from '../utils/format'
import toast from 'react-hot-toast'

const TYPES_CLIENTS = ['Particulier', 'Restaurant', 'Poissonnerie', 'Grossiste', 'Supermarche', 'Association', 'Collectivite']

const formatNumber = (v, d = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d }).format(v ?? 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

// ── Panier / Cart System ──
function CartItem({ item, onRemove, onChangeQty, onChangePrice }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-theme-surface rounded-xl border border-theme">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-theme-primary text-sm">{item.espece}</span>
          <button onClick={() => onRemove(item.id)} className="p-1 text-danger hover:bg-danger/10 rounded-lg"><FiTrash2 className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {/* Quantité */}
          <div className="flex items-center gap-1">
            <button onClick={() => onChangeQty(item.id, Math.max(0.5, item.quantite - 0.5))} className="w-6 h-6 rounded-full bg-theme-card flex items-center justify-center text-xs font-bold hover:bg-theme-hover">-</button>
            <span className="w-14 text-center text-sm font-bold">{formatNumber(item.quantite)} kg</span>
            <button onClick={() => onChangeQty(item.id, item.quantite + 0.5)} className="w-6 h-6 rounded-full bg-theme-card flex items-center justify-center text-xs font-bold hover:bg-theme-hover">+</button>
          </div>
          {/* Prix unitaire (saisi par l'utilisateur) */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-theme-tertiary">×</span>
            <input
              type="number"
              min="1"
              step="100"
              value={item.prixUnitaire}
              onChange={(e) => onChangePrice(item.id, parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 text-sm font-bold text-center border border-theme-subtle rounded-lg bg-theme-card focus:ring-2 focus:ring-accent outline-none"
            />
            <span className="text-xs text-theme-tertiary">Ar/kg</span>
          </div>
          {/* Total */}
          <span className="text-sm font-bold text-primary ml-auto">{formatCurrency(item.total)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Quick Sale Form (saisie directe sans panier) ──
function QuickSaleModal({ isOpen, onClose, stocks, clients, onSave, saving }) {
  const [espece, setEspece] = useState('')
  const [quantite, setQuantite] = useState('')
  const [prixUnitaire, setPrixUnitaire] = useState('')
  const [typeClient, setTypeClient] = useState('Particulier')
  const [clientId, setClientId] = useState('')

  const especesDisponibles = [...new Set(stocks?.filter(s => s.quantite > 0).map(s => s.espece) || [])]

  // Reset form when modal opens
  const handleClose = () => {
    setEspece('')
    setQuantite('')
    setPrixUnitaire('')
    setTypeClient('Particulier')
    setClientId('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!espece || !quantite || !prixUnitaire) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    await onSave({
      espece,
      quantite: parseFloat(quantite),
      prixUnitaire: parseFloat(prixUnitaire),
      typeClient,
      clientId: clientId || undefined
    })
    handleClose()
  }

  const total = (parseFloat(quantite) || 0) * (parseFloat(prixUnitaire) || 0)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Vente Rapide">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Espèce */}
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1.5">Espèce</label>
          <select
            value={espece}
            onChange={(e) => setEspece(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-theme-primary focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            required
          >
            <option value="">Sélectionnez une espèce...</option>
            {especesDisponibles.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Quantité */}
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1.5">Quantité (kg)</label>
          <input
            type="number"
            min="0.1"
            step="0.5"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            placeholder="Ex: 10.5"
            className="w-full px-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-theme-primary placeholder-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            required
          />
        </div>

        {/* Prix unitaire */}
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1.5">Prix unitaire (Ar/kg)</label>
          <input
            type="number"
            min="1"
            step="100"
            value={prixUnitaire}
            onChange={(e) => setPrixUnitaire(e.target.value)}
            placeholder="Ex: 5000"
            className="w-full px-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-theme-primary placeholder-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            required
          />
        </div>

        {/* Type de client */}
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1.5">Type de client</label>
          <select
            value={typeClient}
            onChange={(e) => setTypeClient(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-theme-primary focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
          >
            {TYPES_CLIENTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Client spécifique (optionnel) */}
        {clients?.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1.5">Client (optionnel)</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-theme-primary focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            >
              <option value="">Client anonyme</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.type})</option>)}
            </select>
          </div>
        )}

        {/* Total aperçu */}
        {total > 0 && (
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/10 rounded-xl">
            <span className="text-sm font-medium text-theme-secondary">Total estimé</span>
            <span className="text-lg font-bold text-success">{formatCurrency(total)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
          <Button type="submit" disabled={saving} loading={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer la vente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Invoice Modal ──
function InvoiceModal({ isOpen, onClose, panier, typeClient, onConfirm }) {
  const total = panier.reduce((s, i) => s + i.total, 0)
  const tva = total * 0.055
  const totalTTC = total + tva
  const now = new Date()
  const invoiceNum = `FAC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Facture ${invoiceNum}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-theme">
          <div>
            <h2 className="text-xl font-bold text-primary">SMARTFISH SOGEDIPROMA</h2>
            <p className="text-xs text-theme-secondary">Facture de vente</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-theme-primary">{formatDateShort(now)}</p>
            <p className="text-xs text-theme-secondary">{invoiceNum}</p>
          </div>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 text-sm">
          <FiUser className="w-4 h-4 text-theme-muted" />
          <span className="font-medium text-theme-secondary">Client:</span>
          <span className="capitalize">{typeClient}</span>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-theme-surface">
              <th className="text-left px-3 py-2 font-semibold text-theme-tertiary">Espèce</th>
              <th className="text-right px-3 py-2 font-semibold text-theme-tertiary">Qté</th>
              <th className="text-right px-3 py-2 font-semibold text-theme-tertiary">Prix unit.</th>
              <th className="text-right px-3 py-2 font-semibold text-theme-tertiary">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-subtle">
            {panier.map(item => (
              <tr key={item.id}>
                <td className="px-3 py-2 font-medium text-theme-primary">{item.espece}</td>
                <td className="px-3 py-2 text-right text-theme-secondary">{formatNumber(item.quantite)} kg</td>
                <td className="px-3 py-2 text-right text-theme-secondary">{formatCurrency(item.prixUnitaire)}</td>
                <td className="px-3 py-2 text-right font-bold text-theme-primary">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="border-t border-theme pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-theme-tertiary">Total HT</span><span className="font-bold text-theme-primary">{formatCurrency(total)}</span></div>
          <div className="flex justify-between"><span className="text-theme-tertiary">TVA 5.5%</span><span className="text-theme-primary">{formatCurrency(tva)}</span></div>
          <div className="flex justify-between text-lg border-t border-theme pt-2"><span className="font-bold text-theme-primary">Total TTC</span><span className="font-bold text-primary">{formatCurrency(totalTTC)}</span></div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Modifier</Button>
          <Button onClick={() => { onConfirm(); onClose() }} className="flex items-center gap-2"><FiFile className="w-4 h-4" /> Confirmer la vente</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function VentesLocales() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [panier, setPanier] = useState([])
  const [typeClient, setTypeClient] = useState('Particulier')
  const [showCart, setShowCart] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filterClient, setFilterClient] = useState('')
  const [quickSaleOpen, setQuickSaleOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const limit = 15

  const { data: ventesData, isLoading } = useQuery({
    queryKey: ['ventes', page, search, filterClient],
    queryFn: () => getVentes({ page, limit, espece: search || undefined, typeClient: filterClient || undefined })
  })

  const { data: stocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: getCurrentStock,
    refetchInterval: 30000 // Auto-refresh for real-time stock
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => getClients({ limit: 100, sort: 'nom' })
  })
  const clients = clientsData?.clients || []

  const deleteMutation = useMutation({
    mutationFn: deleteVente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventes'] })
      queryClient.invalidateQueries({ queryKey: ['stocks'] }) // Real-time stock update
      toast.success('Vente supprimée')
      setDeleteConfirm(null)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const createMutation = useMutation({
    mutationFn: createVente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventes'] })
      queryClient.invalidateQueries({ queryKey: ['stocks'] }) // Real-time stock update
      toast.success('Vente enregistrée')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const ventes = ventesData?.ventes || []
  const pagination = ventesData?.pagination || { page: 1, limit, total: 0, pages: 1 }
  const totalCA = ventesData?.totalCA || 0

  // Cart management
  const addToCart = (stock) => {
    setPanier(prev => {
      const existing = prev.find(i => i.espece === stock.espece)
      if (existing) {
        return prev.map(i => i.espece === stock.espece
          ? { ...i, quantite: parseFloat((i.quantite + 1).toFixed(1)), total: parseFloat(((i.quantite + 1) * i.prixUnitaire).toFixed(2)) }
          : i
        )
      }
      // Utiliser le prixVente du stock s'il est défini, sinon 0 (l'utilisateur le saisit)
      const prixDefaut = stock.prixVente > 0 ? stock.prixVente : 0
      return [...prev, { id: Date.now(), espece: stock.espece, quantite: 1, prixUnitaire: prixDefaut, total: prixDefaut }]
    })
    setShowCart(true)
    toast.success(`${stock.espece} ajouté au panier`)
  }

  const removeFromCart = (id) => {
    setPanier(prev => prev.filter(i => i.id !== id))
    if (panier.length <= 1) setShowCart(false)
  }

  const changeQty = (id, qty) => {
    setPanier(prev => prev.map(i => i.id === id ? { ...i, quantite: qty, total: parseFloat((qty * i.prixUnitaire).toFixed(2)) } : i))
  }

  const changePrice = (id, newPrice) => {
    setPanier(prev => prev.map(i => i.id === id
      ? { ...i, prixUnitaire: newPrice, total: parseFloat((i.quantite * newPrice).toFixed(2)) }
      : i
    ))
  }

  const confirmSale = async () => {
    try {
      for (const item of panier) {
        await createMutation.mutateAsync({
          espece: item.espece,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          typeClient,
          clientId: selectedClientId || undefined
        })
      }
      setPanier([])
      setShowCart(false)
    } catch (e) {
      toast.error('Erreur lors de la confirmation des ventes')
    }
  }

  const totalPanier = panier.reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Ventes Locales</h1>
          <p className="text-theme-secondary">{pagination.total} vente(s) — CA: {formatCurrency(totalCA)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={() => setQuickSaleOpen(true)} className="flex items-center gap-2">
            <FiZap className="w-4 h-4" /> Vente Rapide
          </Button>
          <ExportButton
            onExportPDF={() => exportVentesReport(ventes)}
            onExportExcel={async () => {
              const { exportToExcel } = await import('../utils/exportUtils')
              await exportToExcel(ventes, [
                { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('fr-FR') },
                { key: 'espece', label: 'Espèce' },
                { key: 'quantite', label: 'Qté (kg)', render: (r) => r.quantite.toFixed(1) },
                { key: 'prixUnitaire', label: 'Prix unit.', render: (r) => formatCurrency(r.prixUnitaire) },
                { key: 'total', label: 'Total', render: (r) => formatCurrency(r.total) },
                { key: 'typeClient', label: 'Client' },
              ], 'ventes', 'Ventes')
            }}
            size="sm"
          />
          {panier.length > 0 && (
            <Button variant="secondary" onClick={() => setShowCart(!showCart)} className="flex items-center gap-2 relative">
              <FiShoppingCart className="w-4 h-4" />
              Panier ({panier.length})
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white rounded-full text-[10px] flex items-center justify-center font-bold">{panier.length}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stocks disponibles + Panier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock list */}
        <div className={`${showCart ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <Card variant="glass">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-success/10 rounded-xl"><FiPackage className="w-5 h-5 text-success" /></div>
              <div><h3 className="text-lg font-bold text-theme-primary">Stocks Disponibles</h3><p className="text-xs text-theme-secondary">Cliquez pour ajouter au panier</p></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {stocks?.filter(s => s.quantite > 0).map((stock, i) => (
                <button key={stock.id || i} onClick={() => addToCart(stock)}
                  className="group p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-theme hover:border-success/30 hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
                  <p className="font-semibold text-theme-primary text-sm group-hover:text-success transition-colors">{stock.espece}</p>
                  <p className="text-xs text-theme-secondary mt-0.5">{formatNumber(stock.quantite, 1)} {stock.unite}</p>
                  <div className="mt-2 w-full bg-theme-surface rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${stock.quantite <= stock.seuil ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${Math.min((stock.quantite / (stock.seuil * 3)) * 100, 100)}%` }} />
                  </div>
                </button>
              ))}
              {(!stocks || stocks.filter(s => s.quantite > 0).length === 0) && (
                <div className="col-span-full text-center py-8 text-theme-muted"><FiPackage className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Aucun stock disponible</p></div>
              )}
            </div>
          </Card>
        </div>

        {/* Cart */}
        {showCart && (
          <div className="lg:col-span-1">
            <Card variant="glass" className="sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiShoppingCart className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-theme-primary">Panier</h3>
                </div>
                <button onClick={() => { setPanier([]); setShowCart(false) }} className="text-xs text-danger hover:underline">Vider</button>
              </div>

              {panier.length > 0 ? (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {panier.map(item => (
                    <CartItem key={item.id} item={item} onRemove={removeFromCart} onChangeQty={changeQty} onChangePrice={changePrice} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-theme-muted">
                  <FiShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Panier vide</p>
                  <p className="text-xs">Ajoutez des produits depuis les stocks</p>
                </div>
              )}

              {panier.length > 0 && (
                <>
                  {/* Client selection */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-theme-secondary mb-1">Client (optionnel)</label>
                    <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full px-3 py-2 border border-theme-subtle rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none">
                      <option value="">Client anonyme</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.type})</option>)}
                    </select>
                  </div>
                  {/* Client type */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-theme-secondary mb-1">Type de client</label>
                    <select value={typeClient} onChange={(e) => setTypeClient(e.target.value)}
                      className="w-full px-3 py-2 border border-theme-subtle rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none">
                      {TYPES_CLIENTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Total */}
                  <div className="border-t border-theme pt-3 mb-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-theme-primary">Total</span>
                      <span className="font-bold text-primary">{formatCurrency(totalPanier)}</span>
                    </div>
                  </div>

                  <Button onClick={() => setInvoiceOpen(true)} className="w-full flex items-center justify-center gap-2">
                    <FiFile className="w-4 h-4" /> Voir la facture
                  </Button>
                </>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <Card variant="glass" className="!p-4">
        <div className="flex items-center gap-3">
          <FiSearch className="w-5 h-5 text-theme-muted shrink-0" />
          <input type="text" placeholder="Rechercher par espèce..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 bg-transparent border-none outline-none text-theme-secondary placeholder-gray-400" />
          <select value={filterClient} onChange={(e) => { setFilterClient(e.target.value); setPage(1) }}
            className="px-3 py-1.5 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Tous clients</option>
            {TYPES_CLIENTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(search || filterClient) && <button onClick={() => { setSearch(''); setFilterClient(''); setPage(1) }} className="text-sm text-accent hover:underline shrink-0">Réinitialiser</button>}
        </div>
      </Card>

      {/* Ventes Table */}
      {!isLoading && ventes.length > 0 && (
        <Card variant="glass" className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-surface border-b border-theme">
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Espèce</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Qté (kg)</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Prix unit.</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Client</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {ventes.map(v => (
                  <tr key={v.id} className="hover:bg-theme-surface/50">
                    <td className="px-4 py-3 text-theme-secondary whitespace-nowrap">{formatDate(v.date)}</td>
                    <td className="px-4 py-3"><span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">{v.espece}</span></td>
                    <td className="px-4 py-3 text-right text-theme-secondary">{formatNumber(v.quantite)}</td>
                    <td className="px-4 py-3 text-right text-theme-secondary">{formatCurrency(v.prixUnitaire)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-theme-primary">{formatCurrency(v.total)}</td>
                    <td className="px-4 py-3">
                      {v.client ? (
                        <button
                          onClick={() => navigate('/clients')}
                          className="flex items-center gap-1.5 text-accent hover:text-accent-dark hover:underline font-medium"
                          title="Voir la fiche client"
                        >
                          <FiUser className="w-3.5 h-3.5" />
                          {v.client.nom}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">{v.typeClient}</span>
                          <FiExternalLink className="w-3 h-3 opacity-50" />
                        </button>
                      ) : (
                        <span className="capitalize text-theme-secondary">{v.typeClient}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteConfirm(v.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg" title="Supprimer"><FiTrash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme bg-theme-surface/50">
            <p className="text-sm text-theme-secondary">Page {pagination.page} sur {pagination.pages} — Total {formatCurrency(totalCA)}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </Card>
      )}

      {!isLoading && ventes.length === 0 && (
        <div className="text-center py-16">
          <FiDollarSign className="w-16 h-16 mx-auto text-theme-muted mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucune vente</h3>
          <p className="text-theme-muted mb-6">Utilisez le panier pour créer votre première vente</p>
        </div>
      )}

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer la vente">
        <p className="text-theme-tertiary mb-6">Cette action est irréversible. Le stock sera restauré.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </Modal>

      <InvoiceModal isOpen={invoiceOpen} onClose={() => setInvoiceOpen(false)} panier={panier} typeClient={typeClient} onConfirm={confirmSale} />

      {/* Quick Sale Modal */}        <QuickSaleModal
        isOpen={quickSaleOpen}
        onClose={() => setQuickSaleOpen(false)}
        stocks={stocks}
        clients={clients}
        saving={createMutation.isPending}
        onSave={async (data) => {
          await createMutation.mutateAsync(data)
          queryClient.invalidateQueries({ queryKey: ['commercialStats'] })
        }}
      />
    </div>
  )
}
