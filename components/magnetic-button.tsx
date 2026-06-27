'use client'

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useRef } from 'react'

interface MagneticButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export function MagneticButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    x.set((e.clientX - centerX) * 0.2)
    y.set((e.clientY - centerY) * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
    outline: 'border border-primary text-primary hover:bg-primary/10',
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className={`inline-block cursor-pointer ${className}`}
    >
      <button
        onClick={onClick}
        className={`px-6 md:px-8 py-3 md:py-4 rounded-lg font-medium transition-all duration-200 ${variants[variant]}`}
      >
        {children}
      </button>
    </motion.div>
  )
}
