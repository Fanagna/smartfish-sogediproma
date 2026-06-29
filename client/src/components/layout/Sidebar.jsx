import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FiHome, FiDroplet, FiAnchor, FiTrendingUp, FiAlertTriangle,
  FiZap, FiCpu, FiGrid, FiShield, FiGlobe, FiUsers, FiShoppingCart,
  FiChevronDown, FiChevronRight, FiMessageCircle, FiSearch, FiClock,
  FiNavigation, FiTarget, FiDollarSign, FiFile, FiStar, FiPackage, FiMapPin, FiFileText,
  FiUserCheck, FiX
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'

export default function Sidebar({ sidebarOpen, setSidebarOpen, isMobile }) {
  const { user } = useAuth()
  const location = useLocation()
  const [iaExpanded, setIaExpanded] = useState(false)

  useEffect(() => {
    if (location.pathname.startsWith('/ia/') && !iaExpanded) {
      setIaExpanded(true)
    }
  }, [location.pathname])

  const links = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard', color: 'from-primary to-accent' },
    { to: '/dashboard-executif-avance', icon: FiZap, label: 'Exécutif+', roles: ['ADMIN'], color: 'from-warning to-orange-500' },
    { to: '/dashboard-ia', icon: FiCpu, label: 'IA & Analytics', color: 'from-purple-500 to-pink-500' },
    { to: '/dashboard-commercial', icon: FiShoppingCart, label: 'Commercial', roles: ['ADMIN', 'CAPITAINE'], color: 'from-success to-emerald-500' },
    { to: '/dashboard-durabilite', icon: FiShield, label: 'Durabilité', roles: ['ADMIN'], color: 'from-emerald-400 to-teal-500' },
    { to: '/dashboard-export', icon: FiGlobe, label: 'Export', roles: ['ADMIN'], color: 'from-cyan-400 to-blue-500' },
    { to: '/dashboard-operationnel', icon: FiGrid, label: 'Opérationnel', color: 'from-primary-dark to-primary' },
  ]

  const secondaryLinks = [
    { to: '/flotte', icon: FiAnchor, label: 'Flotte', roles: ['ADMIN', 'CAPITAINE'] },
    { to: '/ordres-mission', icon: FiFileText, label: 'Ordres Mission' },
    { to: '/captures', icon: FiDroplet, label: 'Captures' },
    { to: '/stocks', icon: FiTrendingUp, label: 'Stocks' },
    { to: '/anomalies', icon: FiAlertTriangle, label: 'Anomalies' },
    { to: '/clients', icon: FiUsers, label: 'Clients' },
    { to: '/ventes-locales', icon: FiShoppingCart, label: 'Ventes Locales' },
    { to: '/achats-locaux', icon: FiDollarSign, label: 'Achats Locaux' },
    { to: '/exportations', icon: FiGlobe, label: 'Exportations' },
    { to: '/users', icon: FiUserCheck, label: 'Utilisateurs', roles: ['ADMIN'] },
  ]

  const iaModules = [
    { to: '/ia/analyse-risque', icon: FiShield, label: 'Analyse Risque', module: 'IA12' },
    { to: '/ia/anomalies', icon: FiAlertTriangle, label: 'Anomalies IA', module: 'IA9' },
    { to: '/ia/chatbot', icon: FiMessageCircle, label: 'Chatbot Exécutif', module: 'IA15' },
    { to: '/ia/detection-fraude', icon: FiSearch, label: 'Détection Fraude', module: 'IA10' },
    { to: '/ia/maintenance-predictive', icon: FiClock, label: 'Maintenance Préd.', module: 'IA7' },
    { to: '/ia/optimisation-flotte', icon: FiNavigation, label: 'Optimisation Flotte', module: 'IA8' },
    { to: '/ia/predictions-captures', icon: FiTarget, label: 'Prédictions Captures', module: 'IA3' },
    { to: '/ia/prevision-export', icon: FiGlobe, label: 'Prévision Export', module: 'IA11' },
    { to: '/ia/prevision-ventes', icon: FiTrendingUp, label: 'Prévision Ventes', module: 'IA4' },
    { to: '/ia/prix-marche', icon: FiDollarSign, label: 'Prix Marché', module: 'IA5' },
    { to: '/ia/rapports', icon: FiFile, label: 'Rapports IA', module: 'IA13' },
    { to: '/ia/recommandations-dg', icon: FiStar, label: 'Recommandations DG', module: 'IA14' },
    { to: '/ia/stock-intelligence', icon: FiPackage, label: 'Stock Intelligence', module: 'IA6' },
    { to: '/ia/zones-peche', icon: FiMapPin, label: 'Zones Pêche', module: 'IA2' },
  ]

  const filteredLinks = links.filter(link =>
    !link.roles || link.roles.includes(user?.role)
  )

  const filteredSecondary = secondaryLinks.filter(link =>
    !link.roles || link.roles.includes(user?.role)
  )

  // ─── Sidebar Content (reused in both desktop and mobile) ───
  const sidebarContent = (
    <div
      className="flex flex-col h-full backdrop-blur-xl border-r transition-all duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 98%, transparent)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Logo + Close button (mobile only) */}
      <div className="flex-shrink-0 p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-extrabold text-base">SF</span>
          </div>
          <div className="truncate">
            <h1 className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>SmartFish</h1>
            <p className="text-[10px] leading-tight uppercase tracking-wider truncate" style={{ color: 'var(--text-tertiary)' }}>SOGEDIPROMA</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-0.5">
        {/* Dashboard links */}
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          Dashboards
        </p>
        {filteredLinks.map((link) => {
          const isActive = location.pathname === link.to
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`sidebar-link group relative flex items-center gap-3 px-3 py-2.5 rounded-xl ${isActive ? 'sidebar-link-active' : ''}`}
              style={{ color: isActive ? undefined : 'var(--text-tertiary)' }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }} />
              )}
              <div className="sidebar-icon"
                style={{ backgroundColor: isActive ? undefined : 'transparent' }}>
                <link.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium truncate">{link.label}</span>
            </NavLink>
          )
        })}

        {/* Divider */}
        <div className="my-3 border-t" style={{ borderColor: 'var(--border-default)' }} />

        {/* Management links */}
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          Gestion
        </p>
        {filteredSecondary.map((link) => {
          const isActive = location.pathname === link.to
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`sidebar-secondary-link flex items-center gap-3 px-3 py-2.5 rounded-xl ${isActive ? 'sidebar-secondary-active' : ''}`}
              style={{ color: isActive ? undefined : 'var(--text-tertiary)' }}
            >
              <div className="sidebar-icon"
                style={{
                  backgroundColor: isActive ? 'color-mix(in srgb, var(--color-primary) 20%, transparent)' : 'transparent',
                }}>
                <link.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium truncate">{link.label}</span>
            </NavLink>
          )
        })}

        {/* Divider */}
        <div className="my-3 border-t" style={{ borderColor: 'var(--border-default)' }} />

        {/* IA Modules Section */}
        <div>
          <button
            onClick={() => setIaExpanded(!iaExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span>Modules IA</span>
            <div className="p-1 rounded-md transition-all duration-300 hover:opacity-80 flex-shrink-0"
              style={{ color: 'var(--text-tertiary)' }}>
              {iaExpanded ? <FiChevronDown className="w-3.5 h-3.5" /> : <FiChevronRight className="w-3.5 h-3.5" />}
            </div>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            iaExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            {iaModules.map((mod) => {
              const isActive = location.pathname === mod.to
              return (
                <NavLink
                  key={mod.to}
                  to={mod.to}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-accent/15 to-transparent border-l-2 border-accent'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--text-tertiary)',
                    paddingLeft: '2.75rem',
                  }}
                >
                  <div className={`p-1 rounded-md transition-all duration-200 flex-shrink-0 ${
                    isActive ? 'bg-accent/20 scale-105' : 'group-hover:scale-105'
                  }`}>
                    <mod.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium flex-1 truncate">{mod.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 flex-shrink-0"
                    style={{ color: isActive ? 'var(--color-accent)' : 'var(--text-muted)' }}>
                    {mod.module}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <div className="rounded-xl px-3 py-2.5 transition-all duration-300"
          style={{
            backgroundColor: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-default)',
          }}>
          <p className="text-[10px] text-center" style={{ color: 'var(--text-tertiary)' }}>
            SmartFish v2.0
          </p>
          <p className="text-[9px] text-center mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  )

  // ─── Mobile: Overlay sidebar with backdrop ───
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 transition-opacity duration-300"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar slide-in */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-hidden transform transition-all duration-300 ease-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </>
    )
  }

  // ─── Desktop: fixed sidebar ───
  return (
    <div className="w-64 h-screen flex-shrink-0 sticky top-0">
      {sidebarContent}
    </div>
  )
}
