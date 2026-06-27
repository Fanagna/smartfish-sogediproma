'use client'

import { SectionTitle } from '../common/section-title'
import { ScrollReveal } from '../common/scroll-reveal'
import { motion } from 'framer-motion'

const skillCategories = [
  {
    category: 'IT Management',
    skills: [
      { name: 'Infrastructure Management', level: 95 },
      { name: 'Cybersecurity', level: 90 },
      { name: 'Team Leadership', level: 92 },
      { name: 'Project Management', level: 88 },
    ],
  },
  {
    category: 'Backend Development',
    skills: [
      { name: 'Node.js', level: 95 },
      { name: 'Express', level: 92 },
      { name: 'Python', level: 88 },
      { name: 'Database Design', level: 90 },
    ],
  },
  {
    category: 'Frontend Development',
    skills: [
      { name: 'React', level: 95 },
      { name: 'Next.js', level: 93 },
      { name: 'TypeScript', level: 90 },
      { name: 'Tailwind CSS', level: 92 },
    ],
  },
  {
    category: 'Databases',
    skills: [
      { name: 'PostgreSQL', level: 92 },
      { name: 'MySQL', level: 88 },
      { name: 'MongoDB', level: 85 },
      { name: 'Redis', level: 82 },
    ],
  },
  {
    category: 'DevOps & Tools',
    skills: [
      { name: 'Docker', level: 88 },
      { name: 'Git', level: 95 },
      { name: 'Linux', level: 90 },
      { name: 'CI/CD', level: 85 },
    ],
  },
  {
    category: 'AI & Fintech',
    skills: [
      { name: 'Machine Learning', level: 85 },
      { name: 'Algorithmic Trading', level: 88 },
      { name: 'Data Analysis', level: 90 },
      { name: 'Financial Systems', level: 87 },
    ],
  },
]

interface SkillBarProps {
  name: string
  level: number
  delay: number
}

function SkillBar({ name, level, delay }: SkillBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">{name}</span>
        <span className="text-xs text-cyan-400 font-semibold">{level}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          viewport={{ once: true }}
          className="h-full bg-gradient-to-r from-cyan-400 to-violet-600"
        />
      </div>
    </motion.div>
  )
}

export function SkillsSection() {
  return (
    <section id="skills" className="py-20 px-4">
      <div className="container mx-auto">
        <SectionTitle
          title="Skills & Expertise"
          subtitle="Technical proficiencies developed through years of hands-on experience"
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skillCategories.map((category, categoryIndex) => (
            <ScrollReveal
              key={categoryIndex}
              delay={categoryIndex * 0.1}
              direction="up"
            >
              <div className="glass p-6 rounded-lg h-full">
                <h3 className="text-xl font-bold text-cyan-400 mb-6">
                  {category.category}
                </h3>

                <div className="space-y-4">
                  {category.skills.map((skill, skillIndex) => (
                    <SkillBar
                      key={skillIndex}
                      name={skill.name}
                      level={skill.level}
                      delay={categoryIndex * 0.1 + skillIndex * 0.05}
                    />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Additional Skills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 glass p-8 rounded-lg"
        >
          <h3 className="text-2xl font-bold text-gradient mb-6">Soft Skills</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Problem Solving',
              'Communication',
              'Leadership',
              'Adaptability',
              'Critical Thinking',
              'Team Collaboration',
              'Time Management',
              'Innovation',
            ].map((skill, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center"
              >
                <span className="text-sm font-medium text-cyan-300">
                  {skill}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
