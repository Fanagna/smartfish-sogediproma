'use client'

import { AnimatedCard } from '../common/animated-card'
import { SectionTitle } from '../common/section-title'
import { ScrollReveal } from '../common/scroll-reveal'
import { motion } from 'framer-motion'

const competencies = [
  { title: 'IT Management', description: 'Leading technical teams and infrastructure strategy' },
  { title: 'Full Stack Development', description: 'End-to-end web application development' },
  { title: 'AI & Machine Learning', description: 'Building intelligent solutions with Python and AI' },
  { title: 'Fintech Solutions', description: 'Specialized in financial technology implementations' },
  { title: 'Architecture Design', description: 'Designing scalable and robust systems' },
  { title: 'Team Leadership', description: 'Mentoring developers and managing agile teams' },
]

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-4">
      <div className="container mx-auto">
        <SectionTitle
          title="About Me"
          subtitle="A passionate developer and IT manager with expertise in building scalable solutions"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 items-center">
          {/* Left Text */}
          <ScrollReveal direction="left">
            <div className="space-y-6">
              <p className="text-lg text-gray-300 leading-relaxed">
                I am a Full Stack Developer and IT Manager with 3+ years of experience
                building enterprise-level applications. My journey spans from technical
                development to team leadership, where I&apos;ve successfully managed infrastructure,
                cybersecurity initiatives, and high-performing development teams.
              </p>

              <p className="text-lg text-gray-300 leading-relaxed">
                My specialization in Fintech and AI has allowed me to work on cutting-edge
                projects including algorithmic trading systems, AI-powered decision support
                tools, and comprehensive IT park management solutions. I&apos;m passionate
                about clean code, scalable architecture, and mentoring the next generation
                of developers.
              </p>

              <div className="pt-4">
                <h3 className="text-xl font-bold text-white mb-4">Core Values</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                    Excellence in every deliverable
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                    Continuous learning and innovation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                    Strong team collaboration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                    User-centric problem solving
                  </li>
                </ul>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Competencies Grid */}
          <ScrollReveal direction="right">
            <div className="grid grid-cols-1 gap-4">
              {competencies.map((item, index) => (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </AnimatedCard>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            { label: 'Reduced Incidents', value: '-25%' },
            { label: 'Decision Speed', value: '+40%' },
            { label: 'Digitalization', value: '100%' },
            { label: 'Team Size', value: '10+' },
          ].map((stat, index) => (
            <AnimatedCard key={index} delay={index * 0.1}>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            </AnimatedCard>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
