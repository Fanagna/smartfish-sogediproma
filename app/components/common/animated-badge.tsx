'use client'

import { motion } from 'framer-motion'

interface AnimatedBadgeProps {
  text: string
  icon?: React.ReactNode
}

export function AnimatedBadge({ text, icon }: AnimatedBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="inline-flex"
    >
      <div className="glass px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
        {icon && <span className="text-cyan-400">{icon}</span>}
        <span className="animate-pulse-glow bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
          {text}
        </span>
      </div>
    </motion.div>
  )
}
