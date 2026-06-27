'use client'

import { motion } from 'framer-motion'

interface TechStackLogoProps {
  name: string
  icon: React.ReactNode
  delay?: number
}

export function TechStackLogo({ name, icon, delay = 0 }: TechStackLogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1, y: -5 }}
      transition={{
        duration: 0.3,
        delay,
        ease: 'easeOut',
      }}
      viewport={{ once: true }}
      className="flex flex-col items-center gap-2 p-4 rounded-lg glass cursor-pointer hover:border-cyan-500/50 transition-colors"
    >
      <div className="text-4xl">{icon}</div>
      <span className="text-sm text-gray-300 font-medium text-center">{name}</span>
    </motion.div>
  )
}
