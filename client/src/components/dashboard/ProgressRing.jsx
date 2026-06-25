import { useState, useEffect, useRef } from 'react'

export default function ProgressRing({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  trackColor = 'rgba(255,255,255,0.06)',
  label = '',
  sublabel = '',
  animated = true,
  glowIntensity = 0.3,
}) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min((value / max) * 100, 100)
  const offset = circumference - (progress / 100) * circumference

  // Intersection observer for animation on scroll
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Animate the progress
  useEffect(() => {
    if (!isVisible && animated) return
    if (!animated) {
      setProgress(percentage)
      return
    }

    let start = 0
    const duration = 1000
    const startTime = performance.now()

    function animate(currentTime) {
      const elapsed = currentTime - startTime
      const t = Math.min(elapsed / duration, 1)
      // ease-out curve
      const ease = 1 - Math.pow(1 - t, 3)
      const current = ease * percentage
      setProgress(current)
      if (t < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [isVisible, animated, percentage])

  const center = size / 2

  return (
    <div ref={ref} className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${color.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress */}
        <circle
          className="progress-ring-circle"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#glow-${color.replace('#', '')})`}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.19, 1, 0.22, 1)',
          }}
        />
      </svg>

      {/* Center text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-2xl font-bold text-theme-primary tabular-nums">
          {Math.round(progress)}%
        </span>
        {label && (
          <span className="text-[10px] text-theme-tertiary mt-0.5 font-medium">{label}</span>
        )}
      </div>

      {sublabel && (
        <span className="text-xs text-theme-tertiary mt-2">{sublabel}</span>
      )}
    </div>
  )
}
