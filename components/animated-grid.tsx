'use client'

import { motion } from 'framer-motion'

export function AnimatedGrid() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/50" />

      {/* Grid pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 40 0 L 0 0 0 40" fill="none" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Ambient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 100, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <motion.div
        className="absolute top-1/2 right-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"
        animate={{
          x: [0, 50, -100, 0],
          y: [0, 50, 50, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}
