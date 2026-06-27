'use client'

import { motion } from 'framer-motion'
import { AnimatedBadge } from '../animated-badge'
import { MagneticButton } from '../magnetic-button'

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative pt-20">
      <div className="container mx-auto px-4 md:px-6 text-center">
        {/* Badge */}
        <motion.div
          className="mb-6 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatedBadge variant="glow">
            ✨ Bienvenue sur Mon Portfolio
          </AnimatedBadge>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 text-balance leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Chef de Projet IT <br />
          <span className="text-gradient">& Développeur Full Stack</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto text-balance"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Près de 3 ans d&apos;expérience dans la conception d&apos;architectures logicielles, la gouvernance SI et le pilotage de projets de transformation digitale. Expert en Fintech & IA, spécialisé dans les méthodologies modernes de développement accéléré par l&apos;IA.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <MagneticButton
            variant="primary"
            onClick={() =>
              document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Voir Mes Projets
          </MagneticButton>
          <MagneticButton
            variant="outline"
            onClick={() =>
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Nous Contacter
          </MagneticButton>
        </motion.div>

        {/* Floating Stats */}
        <motion.div
          className="grid grid-cols-3 gap-4 md:gap-8 mt-12 md:mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, staggerChildren: 0.1 }}
        >
          {[
            { label: 'Projets Réalisés', value: '20+' },
            { label: 'Années Expérience', value: '3+' },
            { label: 'Technologies', value: '15+' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="glass dark:glass-dark rounded-lg p-4 md:p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">
                {stat.value}
              </div>
              <p className="text-xs md:text-sm text-foreground/60">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-2 bg-primary rounded-full mt-2"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
