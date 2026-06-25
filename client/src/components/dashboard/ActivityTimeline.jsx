import { FiDroplet, FiAlertTriangle, FiTrendingUp, FiAnchor, FiPackage, FiDollarSign } from 'react-icons/fi'

const ICON_MAP = {
  capture: { icon: FiDroplet, color: 'text-accent', bg: 'bg-accent/15' },
  anomalie: { icon: FiAlertTriangle, color: 'text-danger', bg: 'bg-danger/15' },
  vente: { icon: FiDollarSign, color: 'text-success', bg: 'bg-success/15' },
  stock: { icon: FiPackage, color: 'text-warning', bg: 'bg-warning/15' },
  bateau: { icon: FiAnchor, color: 'text-primary', bg: 'bg-primary/15' },
  export: { icon: FiTrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/15' },
}

function formatTimeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function ActivityTimeline({
  activities = [],
  maxItems = 8,
  title = 'Activité récente',
}) {
  const displayActivities = activities.slice(0, maxItems)

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-theme-primary">{title}</h3>

      {displayActivities.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-theme-tertiary">
          <svg className="w-10 h-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Aucune activité récente</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[17px] top-2 bottom-2 w-px bg-white/5" />

          <div className="space-y-0">
            {displayActivities.map((item, index) => {
              const typeConfig = ICON_MAP[item.type] || ICON_MAP.capture
              const Icon = typeConfig.icon

              return (
                <div key={item.id || index} className="relative flex gap-4 py-3 group">
                  {/* Dot + Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`
                      w-9 h-9 rounded-xl flex items-center justify-center
                      ${typeConfig.bg}
                      group-hover:scale-110 transition-transform duration-300
                    `}
                      style={{ border: '1px solid var(--border-subtle)' }}>
                      <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-theme-primary font-medium truncate">
                        {item.title}
                      </p>
                      <span className="text-[11px] text-theme-tertiary whitespace-nowrap flex-shrink-0">
                        {formatTimeAgo(item.date)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-theme-tertiary mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
