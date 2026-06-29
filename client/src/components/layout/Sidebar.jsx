import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  FiHome, FiDroplet, FiAnchor, FiTrendingUp, FiAlertTriangle,
  FiZap, FiCpu, FiGrid, FiShield, FiGlobe, FiUsers, FiShoppingCart,
  FiChevronDown, FiChevronRight, FiMessageCircle, FiSearch, FiClock,
  FiNavigation, FiTarget, FiDollarSign, FiFile, FiStar, FiPackage, FiMapPin, FiFileText,
  FiUserCheck, FiX, FiChevronLeft
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

  // ─── Reset IA expanded when collapsing ───
  useEffect(() => {
    if (!isMobile && !sidebarOpen) {
      setIaExpanded(false)
    }
  }, [isMobile, sidebarOpen])

  // ─── Navigation data ───
  const links = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/dashboard-executif-avance', icon: FiZap, label: 'Exécutif+', roles: ['ADMIN'] },
    { to: '/dashboard-ia', icon: FiCpu, label: 'IA & Analytics' },
    { to: '/dashboard-commercial', icon: FiShoppingCart, label: 'Commercial', roles: ['ADMIN', 'CAPITAINE'] },
    { to: '/dashboard-durabilite', icon: FiShield, label: 'Durabilité', roles: ['ADMIN'] },
    { to: '/dashboard-export', icon: FiGlobe, label: 'Export', roles: ['ADMIN'] },
    { to: '/dashboard-operationnel', icon: FiGrid, label: 'Opérationnel' },
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

  // ─── Desktop: Collapsed mode (icons only) ───
  const renderDesktopCollapsed = () => (
    <div
      className="flex flex-col h-full backdrop-blur-xl border-r transition-all duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 98%, transparent)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Logo - just the icon */}
      <div className="flex-shrink-0 flex justify-center py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-extrabold text-base">SF</span>
        </div>
      </div>

      {/* Navigation - Scrollable, icons only */}
      <nav className="flex-1 overflow-y-auto overscroll-contain py-3 space-y-1 flex flex-col items-center">
        {filteredLinks.map((link) => {
          const isActive = location.pathname === link.to
          return (
            <NavLink
              key={link.to}
              to={link.to}
              title={link.label}
              className={`sidebar-link group relative flex items-center justify-center w-[44px] h-[44px] rounded-xl ${isActive ? 'sidebar-link-active' : ''}`}
              style={{ color: isActive ? undefined : 'var(--text-tertiary)' }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }} />
              )}
              <div className="sidebar-icon" style={{ backgroundColor: isActive ? undefined : 'transparent' }}>
                <link.icon className="w-5 h-5" />
              </div>
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium
                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: 'var(--shadow-elevated)',
                }}>
                {link.label}
              </div>
            </NavLink>
          )
        })}

        {/* Small divider */}
        <div className="w-8 my-1 border-t" style={{ borderColor: 'var(--border-default)' }} />

        {filteredSecondary.map((link) => {
          const isActive = location.pathname === link.to
          return (
            <NavLink
              key={link.to}
              to={link.to}
              title={link.label}
              className={`group relative flex items-center justify-center w-[44px] h-[44px] rounded-xl transition-all duration-200 ${isActive ? 'sidebar-secondary-active' : 'hover:bg-white/5'}`}
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)' }}
            >
              <div
                className="p-2 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: isActive ? 'color-mix(in srgb, var(--color-primary) 20%, transparent)' : 'transparent',
                }}
              >
                <link.icon className="w-5 h-5" />
              </div>
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium
                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: 'var(--shadow-elevated)',
                }}>
                {link.label}
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Toggle expand button */}
      <div className="flex-shrink-0 border-t p-3 flex justify-center" style={{ borderColor: 'var(--border-default)' }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/10"
          style={{ color: 'var(--text-tertiary)' }}
          title="Développer le menu"
          aria-label="Développer le menu"
        >
          <FiChevronLeft className="w-5 h-5 rotate-180" />
        </button>
      </div>
    </div>
  )

  // ─── Desktop: Expanded mode (full sidebar) ───
  const renderDesktopExpanded = () => (
    <div
      className="flex flex-col h-full backdrop-blur-xl border-r transition-all duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 98%, transparent)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Logo */}
      <div className="flex-shrink-0 p-4 border-b flex items-center" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-extrabold text-base">SF</span>
          </div>
          <div className="truncate">
            <h1 className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>SmartFish</h1>
            <p className="text-[10px] leading-tight uppercase tracking-wider truncate" style={{ color: 'var(--text-tertiary)' }}>SOGEDIPROMA</p>
          </div>
        </div>
        {/* Collapse button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          style={{ color: 'var(--text-tertiary)' }}
          title="Réduire le menu"
          aria-label="Réduire le menu"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>
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
              className={`sidebar-link group relative flex items-center gap-3 px-3 py-2.5 rounded-xl ${isActive ? 'sidebar-link-active' : ''}`}
              style={{ color: isActive ? undefined : 'var(--text-tertiary)' }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }} />
              )}
              <div className="sidebar-icon" style={{ backgroundColor: isActive ? undefined : 'transparent' }}>
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
          {renderDesktopExpanded()}
        </div>
      </>
    )
  }

  // ─── Desktop: sticky sidebar ───
  return (
    <div
      className={`flex-shrink-0 h-screen sticky top-0 transition-all duration-300 ease-out`}
      style={{ width: sidebarOpen ? '16rem' : '4.5rem' }}
    >
      {sidebarOpen ? renderDesktopExpanded() : renderDesktopCollapsed()}
    </div>
  )
}
