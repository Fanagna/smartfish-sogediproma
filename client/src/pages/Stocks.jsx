import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getCurrentStock, createStock, updateStock, deleteStock, getCritiquesStock, getRotationStock } from '../services/stockService'
import { getBateaux } from '../services/bateauService'

import ExportButton from '../components/ui/ExportButton'
import { exportStocksReport } from '../utils/exportUtils'
import { FiTrendingUp, FiPlus, FiEdit2, FiTrash2, FiAlertTriangle, FiClock, FiDollarSign, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StockFormModal({ isOpen, onClose, stock, bateaux = [] }) {
  const queryClient = useQueryClient()
  const isEditing = !!stock

  const createMutation = useMutation({
    mutationFn: createStock,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stocks'] }); toast.success('Stock ajouté'); onClose() },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const updateMutation = useMutation({
    mutationFn: (data) => updateStock(stock.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stocks'] }); toast.success('Stock mis à jour'); onClose() },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const data = {
      bateauId: parseInt(form.get('bateauId')),
      espece: form.get('espece'),
      quantite: parseFloat(form.get('quantite')),
      unite: form.get('unite'),
      seuil: parseFloat(form.get('seuil')) || 50,
      prixVente: parseFloat(form.get('prixVente')) || 0
    }
    if (isEditing) updateMutation.mutate(data)
    else createMutation.mutate(data)
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Modifier le stock' : 'Ajouter au stock'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Bateau</label>
            <select name="bateauId" defaultValue={stock?.bateauId || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none">
              <option value="">Sélectionner...</option>
              {bateaux.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Espèce</label>
            <input name="espece" defaultValue={stock?.espece || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="Thon rouge" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Quantité</label>
            <input name="quantite" type="number" step="0.1" min="0" defaultValue={stock?.quantite || ''} required className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Unité</label>
            <select name="unite" defaultValue={stock?.unite || 'kg'} className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none">
              <option value="kg">kg</option>
              <option value="tonnes">tonnes</option>
              <option value="pièces">pièces</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Seuil d'alerte</label>
            <input name="seuil" type="number" step="0.1" min="0" defaultValue={stock?.seuil || 50} className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1">Prix de vente moyen (Ar/kg)</label>
          <input name="prixVente" type="number" step="100" min="0" defaultValue={stock?.prixVente || ''} placeholder="Ex: 5000" className="w-full px-4 py-2.5 border border-theme-subtle rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none" />
          <p className="text-xs text-theme-tertiary mt-1">Ce prix sera pré-rempli lors de la création d'une vente</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={isMutating}>
            {isMutating ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Ajouter au stock'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Stocks() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStock, setEditingStock] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showCritiques, setShowCritiques] = useState(false)
  const queryClient = useQueryClient()

  const { data: stocks, isLoading, isError, error } = useQuery({
    queryKey: ['stocks'],
    queryFn: getCurrentStock
  })

  const { data: bateaux } = useQuery({
    queryKey: ['bateaux-stocks'],
    queryFn: getBateaux
  })

  const { data: critiques } = useQuery({
    queryKey: ['stocks-critiques'],
    queryFn: getCritiquesStock,
    enabled: showCritiques
  })

  const { data: rotation } = useQuery({
    queryKey: ['stocks-rotation'],
    queryFn: getRotationStock,
    enabled: showCritiques
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStock,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stocks'] }); toast.success('Stock retiré'); setDeleteConfirm(null) },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-12 h-12 border-primary" />
          <p className="text-theme-tertiary">Chargement des stocks...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl font-bold text-danger mb-2">Erreur de chargement</p>
          <p className="text-theme-tertiary">{error?.message}</p>
        </div>
      </div>
    )
  }

  const stockTotal = stocks?.reduce((s, st) => s + st.quantite, 0) || 0
  const alertCount = stocks?.filter(s => s.alerte || s.quantite <= s.seuil).length || 0

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Gestion des Stocks</h1>
          <p className="text-theme-secondary">{stocks?.length || 0} produit(s) en stock</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            onExportPDF={() => exportStocksReport(stocks)}
            onExportExcel={async () => {
              const { exportToExcel } = await import('../utils/exportUtils')
              await exportToExcel(stocks, [
                { key: 'espece', label: 'Espèce' },
                { key: 'quantite', label: 'Quantité', render: (r) => r.quantite.toFixed(1) },
                { key: 'unite', label: 'Unité' },
                { key: 'seuil', label: 'Seuil', render: (r) => r.seuil.toFixed(1) },
                { key: 'bateau.nom', label: 'Bateau' },
                { key: 'dateEntree', label: 'Date entrée', render: (r) => new Date(r.dateEntree).toLocaleDateString('fr-FR') },
              ], 'stocks', 'Stocks')
            }}
            size="sm"
          />
          <Button variant="secondary" onClick={() => setShowCritiques(!showCritiques)} className="flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4" />
            {showCritiques ? 'Masquer l\'analyse' : 'Analyse stock'}
          </Button>
          <Button onClick={() => { setEditingStock(null); setModalOpen(true) }} className="flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Ajouter au stock
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl"><FiTrendingUp className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Stock total</p>
              <p className="text-2xl font-bold text-primary">{stockTotal.toFixed(1)} kg</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl"><FiDollarSign className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Espèces différentes</p>
              <p className="text-2xl font-bold text-success">{new Set(stocks?.map(s => s.espece) || []).size}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-warning" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Alertes seuil</p>
              <p className="text-2xl font-bold text-warning">{alertCount}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl"><FiClock className="w-5 h-5 text-accent" /></div>
            <div>
              <p className="text-xs text-theme-secondary font-medium">Bateaux approvisionnés</p>
              <p className="text-2xl font-bold text-accent">{new Set(stocks?.map(s => s.bateauId) || []).size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Intelligence Analysis */}
      {showCritiques && (
        <div className="space-y-4">
          {/* Produits Critiques */}
          <Card variant="glass">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-danger/10 rounded-xl"><FiAlertTriangle className="w-5 h-5 text-danger" /></div>
              <h3 className="text-lg font-bold text-theme-primary">Produits Critiques — Intelligence Stock</h3>
              <span className="px-2.5 py-0.5 bg-danger/10 text-danger rounded-full text-xs font-bold">{critiques?.totalCritiques || 0}</span>
            </div>
            {critiques ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {critiques.ruptureImminente?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-danger mb-2">⛔ Rupture imminente</h4>
                    <div className="space-y-2">
                      {critiques.ruptureImminente.map((r, i) => (
                        <div key={i} className="p-3 bg-danger/5 rounded-xl border border-danger/10">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-theme-primary">{r.espece}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              r.niveauUrgence === 'CRITIQUE' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                            }`}>{r.niveauUrgence}</span>
                          </div>
                          <p className="text-xs text-theme-secondary mt-1">
                            {r.quantiteActuelle} restants — {r.joursRestants} jours estimés
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {critiques.surstockDangereux?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-warning mb-2">📦 Surstock dangereux</h4>
                    <div className="space-y-2">
                      {critiques.surstockDangereux.map((s, i) => (
                        <div key={i} className="p-3 bg-warning/5 rounded-xl border border-warning/10">
                          <span className="font-semibold text-theme-primary">{s.espece}</span>
                          <p className="text-xs text-theme-secondary mt-1">
                            {s.quantiteActuelle} {s.unite} — Ratio: {s.ratio}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!critiques.ruptureImminente?.length && !critiques.surstockDangereux?.length) && (
                  <p className="text-theme-muted py-4 text-center col-span-2">Aucun produit critique détecté ✓</p>
                )}
              </div>
            ) : (
              <Spinner className="w-6 h-6 border-accent" />
            )}
          </Card>

          {/* Rotation intelligente */}
          {rotation?.rotation?.length > 0 && (
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-accent/10 rounded-xl"><FiRefreshCw className="w-5 h-5 text-accent" /></div>
                <h3 className="text-lg font-bold text-theme-primary">Rotation Intelligente (FIFO)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-theme-surface border-b border-theme">
                      <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Espèce</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-theme-tertiary">Quantité</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Date d'entrée</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-theme-tertiary">Âge (jours)</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Priorité</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-theme-tertiary">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-subtle">
                    {rotation.rotation.map((r, i) => (
                      <tr key={i} className="hover:bg-theme-surface/50">
                        <td className="px-4 py-2.5 font-medium text-theme-primary">{r.espece}</td>
                        <td className="px-4 py-2.5 text-right text-theme-secondary">{r.quantite}</td>
                        <td className="px-4 py-2.5 text-theme-tertiary">{formatDate(r.dateEntree)}</td>
                        <td className="px-4 py-2.5 text-right text-theme-secondary">{r.ageEnJours}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            r.priorite === 'HAUTE' ? 'bg-danger/10 text-danger' :
                            r.priorite === 'MOYENNE' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                          }`}>{r.priorite}</span>
                        </td>
                        <td className="px-4 py-2.5 text-theme-tertiary text-xs">{r.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stocks?.map(stock => {
          const isAlerte = stock.alerte || stock.quantite <= stock.seuil
          return (
            <Card key={stock.id} variant="glass" className={`group hover:shadow-2xl transition-all duration-300 ${isAlerte ? 'border-warning/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-theme-primary">{stock.espece}</h3>
                  <p className="text-sm text-theme-secondary">Bateau: {stock.bateau?.nom || '—'}</p>
                </div>
                {isAlerte && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-warning/10 text-warning rounded-full text-xs font-bold">
                    <FiAlertTriangle className="w-3 h-3" /> Seuil
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-extrabold text-theme-primary">{stock.quantite.toFixed(1)}</p>
                    <p className="text-xs text-theme-secondary">{stock.unite}</p>
                  </div>
                  <div className="text-right">
                    {stock.prixVente > 0 && (
                      <>
                        <p className="text-xs text-theme-secondary">Prix vente</p>
                        <p className="text-sm font-bold text-success">{stock.prixVente.toLocaleString('fr-FR')} Ar/kg</p>
                      </>
                    )}
                    <p className="text-xs text-theme-secondary mt-1">Seuil</p>
                    <p className="text-sm font-semibold text-theme-secondary">{stock.seuil} {stock.unite}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-theme-surface rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isAlerte ? 'bg-danger' : stock.quantite > stock.seuil * 3 ? 'bg-success' : 'bg-accent'
                    }`}
                    style={{ width: `${Math.min((stock.quantite / (stock.seuil * 3)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-theme pt-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isAlerte ? 'bg-danger animate-pulse' : 'bg-success'}`} />
                  <span className="text-xs text-theme-secondary">{isAlerte ? 'Stock bas' : 'Stock OK'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingStock(stock); setModalOpen(true) }} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Modifier">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(stock.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Supprimer">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {(!stocks || stocks.length === 0) && (
        <div className="text-center py-16">
          <FiTrendingUp className="w-16 h-16 mx-auto text-theme-muted mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucun stock</h3>
          <p className="text-theme-muted mb-6">Ajoutez des produits au stock</p>
          <Button onClick={() => { setEditingStock(null); setModalOpen(true) }} className="flex items-center gap-2 mx-auto">
            <FiPlus className="w-4 h-4" /> Ajouter au stock
          </Button>
        </div>
      )}

      <StockFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingStock(null) }} stock={editingStock} bateaux={bateaux || []} />
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Retirer du stock">
        <p className="text-theme-tertiary mb-6">Retirer ce produit du stock ? (soft delete)</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Suppression...' : 'Retirer'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
