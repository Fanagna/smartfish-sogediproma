'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function ProfileImage() {
  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* Animated background blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-3xl opacity-50" />
      
      {/* Glow ring effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-primary via-secondary to-accent bg-clip-border opacity-30"
        animate={{
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.5)',
            '0 0 40px rgba(168, 85, 247, 0.5)',
            '0 0 20px rgba(59, 130, 246, 0.5)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Main image container */}
      <motion.div
        className="relative z-10 rounded-2xl overflow-hidden aspect-square w-full shadow-2xl"
        whileHover={{ scale: 1.02, rotateZ: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Image
          src="/profile.jpg"
          alt="Robert Fanagna - Chef de Projet IT"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={95}
        />
      </motion.div>

      {/* Floating badge */}
      <motion.div
        className="absolute -bottom-4 -right-4 z-20 px-4 py-2 rounded-full glass dark:glass-dark text-sm font-semibold text-gradient"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        Mahajanga, Madagascar
      </motion.div>
    </motion.div>
  )
}
