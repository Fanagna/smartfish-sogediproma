'use client'

import { AnimatedCard } from '../common/animated-card'
import { SectionTitle } from '../common/section-title'
import { motion } from 'framer-motion'
import { Briefcase, Calendar } from 'lucide-react'

const experiences = [
  {
    role: 'Responsable SI & Développeur Full Stack Lead',
    company: 'SOGEDIPROMA',
    period: '2025 - Present',
    description:
      'Leading IT strategy, cybersecurity initiatives, and network administration. Managing development teams on enterprise-level projects.',
    highlights: [
      'Pilotage SI et Cybersécurité',
      'Network Administration',
      'Team Management',
      '-25% Security Incidents',
      '+40% Decision Speed',
      '100% Digitalization',
    ],
    skills: [
      'IT Management',
      'Cybersecurity',
      'Full Stack',
      'Team Leadership',
    ],
  },
  {
    role: 'Analyste de Marché & Trader Forex',
    company: 'Independent',
    period: '2023 - Present',
    description:
      'Developing algorithmic trading systems and quantitative analysis tools. Specializing in risk management and market analysis.',
    highlights: [
      'Algorithmic Trading',
      'Quantitative Analysis',
      'Risk Management',
      'Technical Analysis',
    ],
    skills: ['Python', 'Trading', 'Data Analysis', 'MetaTrader'],
  },
  {
    role: 'Technicien Informatique & Développeur Web',
    company: 'SOGEDIPROMA',
    period: '2024',
    description:
      'Developed comprehensive IT Park Management application with real-time tracking, CRUD operations, and analytical dashboard.',
    highlights: [
      'Full Stack Development',
      'Database Design',
      'Real-time Updates',
      'Dashboard Creation',
    ],
    skills: [
      'React',
      'Node.js',
      'PostgreSQL',
      'Dashboard Design',
    ],
  },
  {
    role: 'Technicien Informatique',
    company: 'DIREED',
    period: '2023',
    description:
      'Provided IT support, system administration, and database management. Maintained documentation and infrastructure stability.',
    highlights: [
      'System Administration',
      'IT Support',
      'Database Management',
      'Documentation',
    ],
    skills: ['System Admin', 'Database', 'Support', 'Linux'],
  },
]

export function ExperienceSection() {
  return (
    <section id="experience" className="py-20 px-4">
      <div className="container mx-auto">
        <SectionTitle
          title="Professional Experience"
          subtitle="A journey of growth, leadership, and technical excellence"
        />

        <div className="mt-16 space-y-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Timeline line */}
              {index < experiences.length - 1 && (
                <div className="absolute left-6 top-24 w-0.5 h-32 bg-gradient-to-b from-cyan-500 to-violet-600" />
              )}

              <AnimatedCard className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-8 top-4 w-12 h-12 rounded-full glass flex items-center justify-center">
                  <Briefcase size={20} className="text-cyan-400" />
                </div>

                <div className="ml-8">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white">
                        {exp.role}
                      </h3>
                      <p className="text-cyan-400 font-semibold">{exp.company}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-2 md:mt-0">
                      <Calendar size={16} />
                      <span>{exp.period}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 mb-4">{exp.description}</p>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {exp.highlights.map((highlight, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-400 text-center"
                      >
                        {highlight}
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2">
                    {exp.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
