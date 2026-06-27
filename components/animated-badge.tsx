'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedBadgeProps {
  children: ReactNode
  delay?: number
  variant?: 'default' | 'glow' | 'gradient'
}

export function AnimatedBadge({
  children,
  delay = 0,
  variant = 'default',
}: AnimatedBadgeProps) {
  const variants = {
    default: 'px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20',
    glow: 'px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent border border-accent/30 animate-pulse-glow',
    gradient: 'px-3 py-1 text-xs font-medium rounded-full text-gradient border border-transparent bg-gradient-to-r from-cyan-400/20 to-violet-600/20',
  }

  return (
    <motion.span
      className={variants[variant]}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.span>
  )
}
