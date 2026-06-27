'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  delay?: number
  className?: string
  onClick?: () => void
}

export function AnimatedCard({
  children,
  delay = 0,
  className = '',
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{
        duration: 0.5,
        delay,
        ease: 'easeOut',
      }}
      viewport={{ once: true }}
      onClick={onClick}
      className={`glass p-6 rounded-lg backdrop-blur-md bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors ${className}`}
    >
      {children}
    </motion.div>
  )
}
