'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'

interface StatsCounterProps {
  value: number
  label: string
  suffix?: string
  delay?: number
}

export function StatsCounter({
  value,
  label,
  suffix = '',
  delay = 0,
}: StatsCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))

  useEffect(() => {
    const animation = animate(count, value, {
      duration: 2,
      delay,
      ease: 'easeOut',
    })

    return animation.stop
  }, [value, delay, count])

  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true, margin: '-100px' }}
    >
      <motion.div className="text-3xl md:text-4xl font-bold text-gradient mb-2">
        {rounded}
        {suffix}
      </motion.div>
      <p className="text-foreground/60 text-sm md:text-base">{label}</p>
    </motion.div>
  )
}
