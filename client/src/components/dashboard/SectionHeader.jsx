export default function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  action,
  color = 'primary',
  className = '',
}) {
  const colorMap = {
    primary: 'bg-primary/15 text-primary border-primary/20',
    accent: 'bg-accent/15 text-accent border-accent/20',
    success: 'bg-success/15 text-success border-success/20',
    warning: 'bg-warning/15 text-warning border-warning/20',
    danger: 'bg-danger/15 text-danger border-danger/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  }

  return (
    <div className={`flex items-center justify-between mb-5 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.primary}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-theme-primary">{title}</h3>
          {subtitle && (
            <p className="text-xs text-theme-tertiary mt-0.5">{subtitle}</p>
          )}
        </div>
        {count !== undefined && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}>
            {count}
          </span>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}
    </div>
  )
}
