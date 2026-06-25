import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService'
import { FiUsers, FiPlus, FiTrash2, FiEdit2, FiChevronLeft, FiChevronRight, FiMail, FiShield, FiUser, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'

const ROLES = ['ADMIN', 'CAPITAINE', 'OBSERVATEUR']
const ROLE_COLORS = {
  ADMIN: 'bg-danger/10 text-danger',
  CAPITAINE: 'bg-primary/10 text-primary',
  OBSERVATEUR: 'bg-accent/10 text-accent'
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const emptyForm = { email: '', password: '', nom: '', prenom: '', role: 'OBSERVATEUR' }

export default function Users() {
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const queryClient = useQueryClient()
  const limit = 15

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page, roleFilter],
    queryFn: () => getUsers({ page, limit, role: roleFilter || undefined })
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur créé')
      closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur mis à jour')
      closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur supprimé')
      setDeleteConfirm(null)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
  })

  const users = usersData?.users || []
  const pagination = usersData?.pagination || { page: 1, limit, total: 0, pages: 1 }

  const closeModal = () => {
    setModalOpen(false)
    setEditUser(null)
    setForm({ ...emptyForm })
  }

  const openCreate = () => {
    setEditUser(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  const openEdit = (user) => {
    setEditUser(user)
    setForm({
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      password: ''
    })
    setModalOpen(true)
  }

  const handleSubmit = () => {
    if (!form.email || !form.nom || !form.prenom) {
      return toast.error('Email, nom et prénom sont requis')
    }
    if (!editUser && !form.password) {
      return toast.error('Mot de passe requis pour un nouvel utilisateur')
    }

    const data = {
      email: form.email,
      nom: form.nom,
      prenom: form.prenom,
      role: form.role
    }
    if (form.password) data.password = form.password

    if (editUser) {
      updateMutation.mutate({ id: editUser.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  // Stats
  const statsParRole = {}
  users.forEach(u => {
    const r = u.role || 'OBSERVATEUR'
    statsParRole[r] = (statsParRole[r] || 0) + 1
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-danger/20 to-danger/5 rounded-2xl">
              <FiUsers className="w-7 h-7 text-danger" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Utilisateurs</h1>
          </div>
          <p className="text-theme-secondary ml-1">{pagination.total} utilisateur(s)</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Nouvel utilisateur
        </Button>
      </div>

      {/* Stats par rôle */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statsParRole).map(([role, count]) => (
          <span key={role} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${ROLE_COLORS[role] || 'bg-theme-surface text-theme-tertiary'}`}>
            <FiShield className="w-3 h-3" />
            {role} ({count})
          </span>
        ))}
      </div>

      {/* Filtres */}
      <Card variant="glass" className="!p-4">
        <div className="flex items-center gap-3">
          <FiUser className="w-5 h-5 text-theme-muted shrink-0" />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-theme-subtle rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent">
            <option value="">Tous les rôles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {roleFilter && (
            <button onClick={() => { setRoleFilter(''); setPage(1) }}
              className="text-sm text-accent hover:underline">Réinitialiser</button>
          )}
        </div>
      </Card>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner className="w-12 h-12" /></div>
      ) : users.length > 0 ? (
        <Card variant="glass" className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-surface border-b border-theme">
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Utilisateur</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Email</th>
                  <th className="text-center px-4 py-3 font-semibold text-theme-tertiary">Rôle</th>
                  <th className="text-left px-4 py-3 font-semibold text-theme-tertiary">Créé le</th>
                  <th className="text-right px-4 py-3 font-semibold text-theme-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-theme-surface/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                          u.role === 'ADMIN' ? 'bg-danger' : u.role === 'CAPITAINE' ? 'bg-primary' : 'bg-accent'
                        }`}>
                          {u.prenom?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-theme-primary">{u.prenom} {u.nom}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-theme-secondary">
                        <FiMail className="w-3.5 h-3.5 text-theme-muted" />
                        {u.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ROLE_COLORS[u.role] || 'bg-theme-surface text-theme-tertiary'
                      }`}>
                        <FiShield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-theme-tertiary text-xs">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="w-3 h-3" />
                        {formatDate(u.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg mr-1" title="Modifier">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(u.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg" title="Supprimer">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                className="p-1.5 rounded-lg hover:bg-theme-card disabled:opacity-30"><FiChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="text-center py-16">
          <FiUsers className="w-16 h-16 mx-auto text-theme-muted mb-4" />
          <h3 className="text-xl font-bold text-theme-secondary mb-2">Aucun utilisateur</h3>
          <p className="text-theme-muted mb-6">Créez votre premier utilisateur</p>
          <Button onClick={openCreate}><FiPlus className="w-4 h-4 mr-2" /> Nouvel utilisateur</Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal}
        title={editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Prénom *</label>
              <input type="text" value={form.prenom}
                onChange={(e) => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent"
                placeholder="Jean" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Nom *</label>
              <input type="text" value={form.nom}
                onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent"
                placeholder="Dupont" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Email *</label>
            <input type="email" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent"
              placeholder="utilisateur@smartfish.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Mot de passe {editUser ? <span className="text-theme-muted">(laisser vide pour ne pas changer)</span> : '*'}
            </label>
            <input type="password" value={form.password} placeholder={editUser ? '••••••••' : 'Minimum 6 caractères'}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Rôle *</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(role => (
                <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role }))}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    form.role === role
                      ? 'border-primary bg-primary/5 ring-1 ring-primary text-primary'
                      : 'border-theme-subtle hover:border-theme text-theme-secondary'
                  }`}>
                  <FiShield className="w-4 h-4 mx-auto mb-1" />
                  {role}
                </button>
              ))}
            </div>
            <p className="text-xs text-theme-tertiary mt-1">
              {form.role === 'ADMIN' ? 'Accès complet à toutes les fonctionnalités' :
               form.role === 'CAPITAINE' ? 'Gestion de la flotte, captures et stocks' :
               'Consultation des données et rapports'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2">
              <FiUser className="w-4 h-4" />
              {editUser
                ? (updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour')
                : (createMutation.isPending ? 'Création...' : 'Créer l\'utilisateur')
              }
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer l'utilisateur">
        <p className="text-theme-tertiary mb-2">Cette action est irréversible.</p>
        <p className="text-sm text-theme-secondary mb-6">Toutes les données liées à cet utilisateur seront également supprimées.</p>
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
