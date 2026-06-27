'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  delay?: number
  hover?: boolean
  className?: string
}

export function AnimatedCard({
  children,
  delay = 0,
  hover = true,
  className = '',
}: AnimatedCardProps) {
  return (
    <motion.div
      className={`glass rounded-xl p-6 md:p-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: 'easeOut',
      }}
      viewport={{ once: true, margin: '-80px' }}
      whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
    >
      {children}
    </motion.div>
  )
}
