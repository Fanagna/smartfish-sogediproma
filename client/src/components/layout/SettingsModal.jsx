import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useThemeStore } from '../../stores/themeStore'
import toast from 'react-hot-toast'
import { FiSun, FiMoon, FiGlobe, FiBell } from 'react-icons/fi'

export default function SettingsModal({ isOpen, onClose }) {
  const { mode, toggleMode } = useThemeStore()
  const isDark = mode === 'dark'

  const settingItems = [
    {
      id: 'theme',
      label: 'Thème',
      description: isDark ? 'Mode sombre actif' : 'Mode clair actif',
      icon: isDark ? FiMoon : FiSun,
      iconBg: isDark ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500',
      action: toggleMode,
      buttonText: isDark ? 'Passer en mode clair' : 'Passer en mode sombre'
    },
    {
      id: 'langue',
      label: 'Langue',
      description: 'Français (Malgache)',
      icon: FiGlobe,
      iconBg: 'bg-accent/10 text-accent',
      action: () => toast('🌐 Seulement le français est disponible pour le moment'),
      buttonText: 'Changer de langue'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Notifications push activées',
      icon: FiBell,
      iconBg: 'bg-success/10 text-success',
      action: () => toast('🔔 Préférences de notifications — bientôt disponible'),
      buttonText: 'Configurer'
    }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Paramètres">
      <div className="space-y-4">
        {settingItems.map(item => (
          <div key={item.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-theme-subtle bg-theme-surface hover:border-theme transition-all">
            <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-theme-primary text-sm">{item.label}</p>
              <p className="text-xs text-theme-tertiary">{item.description}</p>
            </div>
            <button onClick={item.action}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-theme-subtle text-theme-secondary hover:bg-theme-card hover:border-theme transition-all shrink-0">
              {item.buttonText}
            </button>
          </div>
        ))}

        {/* Info */}        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
          <p className="text-xs text-theme-tertiary">
            SmartFish SOGEDIPROMA v2.0
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  )
}
