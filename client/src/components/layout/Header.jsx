import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FiBell, FiUser, FiChevronDown, FiLogOut, FiSettings, FiSun, FiMoon, FiMenu } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { useThemeStore } from '../../stores/themeStore'
import { getNotifications } from '../../services/notificationService'
import { connectSocket, disconnectSocket } from '../../services/socket'
import ProfileModal from './ProfileModal'
import SettingsModal from './SettingsModal'
import NotificationPanel from './NotificationPanel'
import toast from 'react-hot-toast'

export default function Header({ sidebarOpen, setSidebarOpen, isMobile }) {
  const { user, logout, token } = useAuth()
  const { mode, toggleMode } = useThemeStore()
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifPanelOpen, setNotifPanelOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [socketConnected, setSocketConnected] = useState(false)

  const { data: notifData } = useQuery({
    queryKey: ['notifications-header'],
    queryFn: () => getNotifications({ limit: 5, unreadOnly: true }),
    refetchInterval: socketConnected ? 60000 : 15000
  })
  const unreadCount = notifData?.unreadCount || 0

  // ─── Connexion WebSocket temps réel ───
  useEffect(() => {
    if (!token) return
    const socket = connectSocket(token)

    const handleConnect = () => setSocketConnected(true)
    const handleDisconnect = () => setSocketConnected(false)
    const handleConnectError = () => setSocketConnected(false)

    const handleNewNotification = (notification) => {
      // Invalider les caches React Query pour forcer le rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['notifications-header'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })

      // Toast avec le message
      const typeStyles = {
        info: { icon: 'ℹ️' },
        success: { icon: '✅' },
        warning: { icon: '⚠️' },
        error: { icon: '🚨' }
      }
      const style = typeStyles[notification.type] || typeStyles.info
      toast(`${style.icon} ${notification.message}`, {
        duration: 5000,
        position: 'top-right',
      })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('notification:new', handleNewNotification)

    // État initial
    setSocketConnected(socket.connected)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('notification:new', handleNewNotification)
    }
  }, [token, queryClient])

  // Nettoyage à la déconnexion
  useEffect(() => {
    if (!token) {
      disconnectSocket()
      setSocketConnected(false)
    }
  }, [token])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const userInitial = user?.prenom?.charAt(0)?.toUpperCase() || 'U'
  const isDark = mode === 'dark'

  return (
    <>
      <header
        className="h-16 px-6 flex items-center justify-between transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-card)',
        }}>
      {/* Left: Hamburger + Logo + Date */}
      <div className="flex items-center gap-3">
        {/* Hamburger menu - visible on tablet & mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="Ouvrir le menu"
          aria-expanded={sidebarOpen}
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold leading-tight"
              style={{ color: 'var(--text-primary)' }}>SmartFish</h1>
            <p className="text-[10px] leading-tight"
              style={{ color: 'var(--text-tertiary)' }}>SOGEDIPROMA</p>
          </div>
        </div>
        <div className="hidden md:block h-6 w-px" style={{ backgroundColor: 'var(--border-default)' }} />
        <div className="hidden md:block">
          <p className="text-xs font-medium capitalize"
            style={{ color: 'var(--text-secondary)' }}>
            {formatDate(currentTime)}
          </p>
          <p className="text-[11px] tabular-nums"
            style={{ color: 'var(--text-tertiary)' }}>
            {formatTime(currentTime)}
          </p>
        </div>
      </div>

      {/* Right: Theme Toggle + Notifications + Avatar + User */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleMode}
          className="relative p-2.5 rounded-xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 group"
          style={{ color: 'var(--text-tertiary)' }}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          <div className="relative w-5 h-5">
            {/* Sun icon — visible in dark mode, hidden in light */}
            <FiSun className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
            }`} />
            {/* Moon icon — visible in light mode, hidden in dark */}
            <FiMoon className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${
              isDark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`} />
          </div>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setNotifPanelOpen(!notifPanelOpen)}
            className="relative p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10 group"
            style={{ color: 'var(--text-tertiary)' }}>
            {/* Indicateur de connexion temps réel */}
            <span className={`absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full transition-colors duration-300 ${
              socketConnected ? 'bg-success' : 'bg-danger'
            }`} />
            <FiBell className="w-5 h-5 transition-colors" />
            {unreadCount > 0 && (
              <>
                <span className="notification-dot" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
          </button>
          {notifPanelOpen && <NotificationPanel onClose={() => setNotifPanelOpen(false)} />}
        </div>

        {/* Divider */}
        <div className="h-8 w-px" style={{ backgroundColor: 'var(--border-default)' }} />

        {/* Avatar + User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10 group"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <div className={`
              w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold
              bg-gradient-to-br from-primary to-accent text-white
              shadow-lg shadow-primary/20
              group-hover:shadow-primary/30 transition-shadow
            `}>
              {userInitial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight"
                style={{ color: 'var(--text-primary)' }}>
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-[10px] leading-tight uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}>
                {user?.role}
              </p>
            </div>
            <FiChevronDown className="w-3.5 h-3.5 hidden sm:block"
              style={{ color: 'var(--text-tertiary)' }} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 z-40">
                <div className="rounded-xl animate-slide-down"
                  style={{
                    backgroundColor: isDark ? 'rgba(26, 29, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid var(--border-strong)`,
                    boxShadow: 'var(--shadow-elevated)',
                  }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {user?.prenom} {user?.nom}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { setShowUserMenu(false); setProfileOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }}>
                      <FiUser className="w-4 h-4" />
                      Profil
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); setSettingsOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }}>
                      <FiSettings className="w-4 h-4" />
                      Paramètres
                    </button>
                    <button
                      onClick={toggleMode}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }}>
                      {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                      {isDark ? 'Mode clair' : 'Mode sombre'}
                    </button>
                  </div>
                  <div className="border-t p-1.5" style={{ borderColor: 'var(--border-default)' }}>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>

      {/* Profile Modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
