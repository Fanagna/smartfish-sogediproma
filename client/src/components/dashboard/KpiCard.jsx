import { useState, useEffect, useRef } from 'react'
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi'
import Card from '../ui/Card'

// ─── Mini Sparkline ─────────────────────────────────────────────────────────
function MiniSparkline({ data, color = '#3B82F6', height = 36 }) {
  if (!data || data.length < 2) return null

  const width = 120
  const padding = 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((val - min) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')

  const gradientId = `sparkline-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`

  return (
    <svg width={width} height={height} className="opacity-70">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${points} ${padding + chartWidth},${padding + chartHeight} ${padding},${padding + chartHeight}`}
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}

// ─── Confetti Particles ─────────────────────────────────────────────────────
function SuccessParticles() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const colors = ['#FFD700', '#00E676', '#3B82F6', '#00BCD4', '#FF8A80']
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      color: colors[i % colors.length],
      delay: Math.random() * 0.3,
      size: 3 + Math.random() * 4,
    }))
    setParticles(newParticles)
    const timer = setTimeout(() => setParticles([]), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: '60%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Main KPI Card ──────────────────────────────────────────────────────────
export default function KpiCard({
  title,
  value,
  unit = '',
  delta,
  deltaLabel = '',
  icon: Icon,
  color = 'primary',
  sparklineData,
  trend = 'neutral',
  isTargetAhead = false,
  onClick,
}) {
  const colorMap = {
    primary: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', glow: 'shadow-glow', line: '#3B82F6' },
    accent: { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', glow: 'shadow-glow-cyan', line: '#00BCD4' },
    success: { text: 'text-success', bg: 'bg-success/10', border: 'border-success/20', glow: 'shadow-glow', line: '#00E676' },
    warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', glow: 'shadow-glow-warm', line: '#FFD700' },
    danger: { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', glow: 'shadow-glow', line: '#FF8A80' },
  }

  const c = colorMap[color] || colorMap.primary

  // Delta display
  const deltaValue = delta !== undefined && delta !== null
  const DeltaIconComp = delta > 0 ? FiTrendingUp : delta < 0 ? FiTrendingDown : FiMinus
  const deltaColor = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-theme-tertiary'
  const deltaBg = delta > 0 ? 'bg-success/10' : delta < 0 ? 'bg-danger/10' : 'bg-black/5 dark:bg-white/5'

  // Format number
  const formatValue = (val) => {
    if (val === undefined || val === null) return '—'
    if (typeof val === 'number') {
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
      if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`
      return val.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
    }
    return val
  }

  return (
    <Card
      variant="glass"
      hover={true}
      className={`
        relative overflow-hidden cursor-pointer
        ${isTargetAhead ? 'animate-glow-pulse border-warning/30' : ''}
      `}
      onClick={onClick}
    >
      {/* Top row: icon + title */}
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 ${c.bg} rounded-xl`}>
          {Icon && <Icon className={`w-5 h-5 ${c.text}`} />}
        </div>
        {isTargetAhead && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-warning/15 text-warning text-[10px] font-bold rounded-full border border-warning/20">
            <FiTrendingUp className="w-3 h-3" />
            En avance
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className={`kpi-value text-5xl font-bold ${c.text} tabular-nums`}>
          {formatValue(value)}
        </span>
        {unit && (
          <span className="text-sm text-theme-tertiary font-medium">{unit}</span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm text-theme-secondary mb-3">{title}</p>

      {/* Delta + Sparkline row */}
      <div className="flex items-center justify-between">
        {deltaValue && (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${deltaBg}`}>
            <span className={`flex items-center gap-0.5 text-xs font-bold ${deltaColor}`}>
              {DeltaIconComp && <DeltaIconComp className="w-3.5 h-3.5" />}
              {delta > 0 ? '+' : ''}{delta}%
            </span>
            {deltaLabel && (
              <span className="text-[10px] text-text-tertiary">{deltaLabel}</span>
            )}
          </div>
        )}
        {sparklineData && (
          <MiniSparkline data={sparklineData} color={c.line} />
        )}
      </div>

      {/* Success particles */}
      {isTargetAhead && <SuccessParticles />}
    </Card>
  )
}
