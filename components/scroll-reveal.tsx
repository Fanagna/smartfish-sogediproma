'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.6,
}: ScrollRevealProps) {
  const directionVariants = {
    up: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } },
    down: { initial: { opacity: 0, y: -40 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 } },
  }

  const vars = directionVariants[direction]

  return (
    <motion.div
      initial={vars.initial}
      whileInView={vars.animate}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}
