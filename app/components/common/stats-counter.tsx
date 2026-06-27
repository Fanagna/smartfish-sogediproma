'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

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
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let animationFrame: number
    let currentValue = 0
    const increment = value / 100

    const animate = () => {
      currentValue += increment
      if (currentValue < value) {
        setDisplayValue(Math.floor(currentValue))
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    const timer = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate)
    }, delay * 1000)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(animationFrame)
    }
  }, [value, delay])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
        {displayValue}
        {suffix}
      </div>
      <p className="text-gray-400 text-sm md:text-base">{label}</p>
    </motion.div>
  )
}
