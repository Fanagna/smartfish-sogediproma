import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiMail, FiUser, FiShield, FiLock } from 'react-icons/fi'
import { useAuthStore } from '../../stores/authStore'

export default function ProfileModal({ isOpen, onClose }) {
  const { user, login } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const ROLES = ['ADMIN', 'CAPITAINE', 'OBSERVATEUR']
  const isAdmin = user?.role === 'ADMIN'

  const [form, setForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'OBSERVATEUR'
  })

  const handleSave = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      return toast.error('Nom, prénom et email sont requis')
    }
    setSaving(true)
    try {
      const data = { nom: form.nom, prenom: form.prenom, email: form.email }
      if (form.password) data.password = form.password
      // Seul l'admin peut changer son rôle
      if (isAdmin && form.role !== user?.role) data.role = form.role

      const { data: updatedUser } = await api.patch('/auth/me', data)
      // Update local user state with fresh data
      login(updatedUser, useAuthStore.getState().token)
      toast.success('Profil mis à jour')
      setEditing(false)
      setForm(f => ({ ...f, password: '' }))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  }) : '—'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mon Profil">
      <div className="space-y-6">
        {/* Avatar + Nom */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20">
            {user?.prenom?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-bold text-theme-primary">{user?.prenom} {user?.nom}</p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <FiShield className="w-3 h-3" />
              {user?.role}
            </span>
          </div>
        </div>

        {!editing ? (
          <>
            {/* Informations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-theme-secondary font-medium">Prénom</p>
                <p className="font-semibold text-theme-primary">{user?.prenom}</p>
              </div>
              <div>
                <p className="text-xs text-theme-secondary font-medium">Nom</p>
                <p className="font-semibold text-theme-primary">{user?.nom}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FiMail className="w-4 h-4 text-theme-muted" />
              <span className="text-theme-primary">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FiUser className="w-4 h-4 text-theme-muted" />
              <span className="text-theme-primary">Membre depuis le {formatDate(user?.createdAt)}</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onClose}>Fermer</Button>
              <Button onClick={() => setEditing(true)}>Modifier</Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Prénom</label>
                <input type="text" value={form.prenom}
                  onChange={(e) => setForm(f => ({ ...f, prenom: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Nom</label>
                <input type="text" value={form.nom}
                  onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Email</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Nouveau mot de passe <span className="text-theme-muted">(laisser vide pour ne pas changer)</span>
              </label>
              <input type="password" value={form.password} placeholder="••••••••"
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 border border-theme-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" />
            </div>

            {/* Rôle — visible seulement pour ADMIN */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  <FiShield className="w-4 h-4 inline mr-1" />
                  Rôle <span className="text-theme-muted">(admin seulement)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(role => (
                    <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role }))}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        form.role === role
                          ? 'border-primary bg-primary/5 ring-1 ring-primary text-primary'
                          : 'border-theme-subtle hover:border-theme text-theme-secondary'
                      }`}>
                      <FiLock className={`w-3.5 h-3.5 mx-auto mb-0.5 ${role === 'ADMIN' ? 'text-danger' : role === 'CAPITAINE' ? 'text-primary' : 'text-accent'}`} />
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setEditing(false); setForm(f => ({ ...f, password: '' })) }}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving} loading={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
