'use client'

import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

interface MagneticButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
}

export function MagneticButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)

    const distance = Math.sqrt(x * x + y * y)

    if (distance < 100) {
      setPosition({ x: x * 0.2, y: y * 0.2 })
    } else {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-cyan-500/50',
    secondary:
      'bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-violet-500/50',
    outline:
      'border border-cyan-400/50 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10',
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      <motion.button
        animate={{ x: position.x, y: position.y }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        onClick={onClick}
        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${variantClasses[variant]} ${className}`}
      >
        {children}
      </motion.button>
    </div>
  )
}
