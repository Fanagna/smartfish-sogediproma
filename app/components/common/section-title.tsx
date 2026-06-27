'use client'

import { motion } from 'framer-motion'

interface SectionTitleProps {
  title: string
  subtitle?: string
  align?: 'left' | 'center' | 'right'
}

export function SectionTitle({
  title,
  subtitle,
  align = 'center',
}: SectionTitleProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={alignClass}
    >
      <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-gradient">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
      )}
      <div
        className={`h-1 w-20 bg-gradient-to-r from-cyan-400 to-violet-600 rounded-full mt-6 ${
          align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''
        }`}
      />
    </motion.div>
  )
}
