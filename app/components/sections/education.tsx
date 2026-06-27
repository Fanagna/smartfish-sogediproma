'use client'

import { SectionTitle } from '../common/section-title'
import { motion } from 'framer-motion'
import { Award, GraduationCap } from 'lucide-react'

const education = [
  {
    degree: 'Licence Informatique',
    institution: 'École Supérieure Saint Gabriel de Mahajanga',
    period: '2022 - 2026',
    description:
      'Comprehensive computer science education covering software development, databases, networks, and artificial intelligence.',
    status: 'In Progress',
  },
  {
    degree: 'Self-Learning: Forex Trading & Cryptocurrency',
    institution: 'Independent Study',
    period: '2023 - Present',
    description:
      'Continuous self-education in algorithmic trading, market analysis, risk management, and financial technology.',
    status: 'Ongoing',
  },
]

const certifications = [
  {
    title: 'Full Stack Web Development',
    issuer: 'Self-Certified',
    date: '2023',
    skills: ['React', 'Node.js', 'Databases', 'Deployment'],
  },
  {
    title: 'AI & Machine Learning Fundamentals',
    issuer: 'Self-Certified',
    date: '2024',
    skills: ['Python', 'TensorFlow', 'Data Science', 'ML Models'],
  },
  {
    title: 'IT Security & Infrastructure',
    issuer: 'Self-Certified',
    date: '2024',
    skills: ['Cybersecurity', 'Networks', 'Linux', 'Docker'],
  },
]

const languages = [
  { language: 'Malagasy', level: 'Native', proficiency: 100 },
  { language: 'French', level: 'Fluent', proficiency: 95 },
  { language: 'English', level: 'Professional', proficiency: 85 },
]

export function EducationSection() {
  return (
    <section id="education" className="py-20 px-4">
      <div className="container mx-auto">
        <SectionTitle
          title="Education & Learning"
          subtitle="Formal education combined with continuous self-improvement and certifications"
        />

        {/* Formal Education */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gradient mb-8 flex items-center gap-3">
            <GraduationCap size={28} />
            Formal Education
          </h3>

          <div className="space-y-6">
            {education.map((edu, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass p-6 rounded-lg"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      {edu.degree}
                    </h4>
                    <p className="text-cyan-400 font-semibold">
                      {edu.institution}
                    </p>
                  </div>
                  <div className="inline-flex px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-sm font-medium w-fit">
                    {edu.status}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-3">{edu.period}</p>
                <p className="text-gray-300">{edu.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gradient mb-8 flex items-center gap-3">
            <Award size={28} />
            Certifications & Achievements
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass p-6 rounded-lg hover:border-cyan-500/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {cert.title}
                    </h4>
                    <p className="text-sm text-gray-400">{cert.issuer}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">{cert.date}</p>

                <div className="flex flex-wrap gap-2">
                  {cert.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 glass p-8 rounded-lg"
        >
          <h3 className="text-2xl font-bold text-gradient mb-8">Languages</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {languages.map((lang, index) => (
              <div key={index} className="text-center">
                <h4 className="text-lg font-bold text-white mb-2">
                  {lang.language}
                </h4>
                <p className="text-cyan-400 font-semibold mb-4">{lang.level}</p>

                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${lang.proficiency}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
