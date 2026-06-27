'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
  staggerChildren?: boolean
}

const directionVariants = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  staggerChildren = false,
}: ScrollRevealProps) {
  const initial = {
    opacity: 0,
    ...directionVariants[direction],
  }

  const animate = {
    opacity: 1,
    x: 0,
    y: 0,
  }

  if (staggerChildren && Array.isArray(children)) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: delay,
            },
          },
        }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true, margin: '-100px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
