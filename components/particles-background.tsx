'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Particle {
  id: number
  left: number
  top: number
  delay: number
  duration: number
  size: number
}

export function ParticlesBackground() {
  const particles = useMemo(() => {
    const array: Particle[] = []
    for (let i = 0; i < 20; i++) {
      array.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        size: 2 + Math.random() * 4,
      })
    }
    return array
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-cyan-400/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -300, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
