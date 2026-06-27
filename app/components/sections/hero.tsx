'use client'

import { AnimatedBadge } from '../common/animated-badge'
import { MagneticButton } from '../common/magnetic-button'
import { StatsCounter } from '../common/stats-counter'
import { motion } from 'framer-motion'
import { Download, Code2 as GithubIcon, Share2 as LinkedinIcon, Mail as MailIcon } from 'lucide-react'
import Image from 'next/image'

export function HeroSection() {
  return (
    <section id="home" className="min-h-screen pt-32 pb-20 px-4 flex items-center">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <AnimatedBadge
              text="Available for opportunities"
              icon="✨"
            />

            {/* Main Title */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold font-heading mb-4 text-white"
              >
                ROBERT <span className="text-gradient">FANAGNA</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-2xl md:text-3xl text-cyan-400 font-semibold mb-4"
              >
                Full Stack Developer & IT Manager
              </motion.p>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-gray-300 leading-relaxed max-w-xl"
            >
              Specialized in Fintech & AI. I build scalable, high-performance applications
              with 3+ years of experience managing technical teams and delivering
              enterprise-level solutions. Currently based in Mahajanga, Madagascar.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <MagneticButton variant="primary">
                <Download className="inline mr-2" size={18} />
                Download CV
              </MagneticButton>
              <MagneticButton variant="secondary">
                View Projects
              </MagneticButton>
              <MagneticButton variant="outline">
                <MailIcon className="inline mr-2" size={18} />
                Contact Me
              </MagneticButton>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex gap-4 pt-4"
            >
              <motion.a
                whileHover={{ scale: 1.1, y: -3 }}
                href="https://github.com/robertfanagna"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 glass rounded-full text-white hover:text-cyan-400 transition-colors"
              >
                <GithubIcon size={20} />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -3 }}
                href="https://linkedin.com/in/robertfanagna"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 glass rounded-full text-white hover:text-cyan-400 transition-colors"
              >
                <LinkedinIcon size={20} />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -3 }}
                href="mailto:robertfanagna374@gmail.com"
                className="p-3 glass rounded-full text-white hover:text-cyan-400 transition-colors"
              >
                <MailIcon size={20} />
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Right Content - Profile Image & Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            {/* Profile Image */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative w-72 h-72 mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-violet-500/30 rounded-full blur-3xl" />
              <div className="absolute inset-2 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-full p-1">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-black/50">
                  <Image
                    src="/hero-profile.png"
                    alt="Robert Fanagna"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="glass p-6 rounded-lg w-full max-w-sm"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <StatsCounter value={3} label="Years" suffix="+" delay={0.1} />
                <StatsCounter
                  value={20}
                  label="Projects"
                  suffix="+"
                  delay={0.2}
                />
                <div className="flex flex-col items-center justify-center">
                  <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                    100%
                  </div>
                  <p className="text-gray-400 text-sm md:text-base">Dedicated</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
