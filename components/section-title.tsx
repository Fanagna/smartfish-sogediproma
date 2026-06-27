'use client'

import { motion } from 'framer-motion'

interface SectionTitleProps {
  title: string
  subtitle?: string
  delay?: number
}

export function SectionTitle({
  title,
  subtitle,
  delay = 0,
}: SectionTitleProps) {
  return (
    <motion.div
      className="mb-12 md:mb-16"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true, margin: '-100px' }}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4 text-balance">
        <span className="text-gradient">{title}</span>
      </h2>
      {subtitle && (
        <p className="text-lg text-foreground/70 text-balance max-w-2xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
