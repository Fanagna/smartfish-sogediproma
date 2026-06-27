'use client'

import { AnimatedCard } from '../common/animated-card'
import { SectionTitle } from '../common/section-title'
import { motion } from 'framer-motion'
import { ExternalLink, Code2 as GithubIcon } from 'lucide-react'
import Image from 'next/image'

const projects = [
  {
    title: 'SmartFish Decision AI',
    description:
      'Intelligent decision support system leveraging AI and machine learning for financial analysis and predictive insights.',
    image: '/project-1.png',
    tech: ['React', 'Node.js', 'PostgreSQL', 'Python', 'TensorFlow', 'AI'],
    github: 'https://github.com/robertfanagna',
    demo: '#',
    highlights: ['Real-time Analytics', 'ML Models', 'Dashboard'],
  },
  {
    title: 'Site Institutionnel SOGEDIPROMA',
    description:
      'Modern corporate website with SEO optimization, responsive design, and user-centric UX. Deployed and managed production environment.',
    image: '/project-2.png',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'SEO', 'Responsive'],
    github: 'https://github.com/robertfanagna',
    demo: '#',
    highlights: ['SEO Optimized', 'Responsive', 'Modern Design'],
  },
  {
    title: 'Gestion Parc Informatique',
    description:
      'Comprehensive IT Park Management application with real-time device tracking, CRUD operations, and administrative dashboard.',
    image: '/project-3.png',
    tech: ['React', 'Express', 'PostgreSQL', 'Real-time', 'Dashboard'],
    github: 'https://github.com/robertfanagna',
    demo: '#',
    highlights: ['Real-time Updates', 'CRUD System', 'Analytics'],
  },
]

export function ProjectsSection() {
  return (
    <section id="projects" className="py-20 px-4">
      <div className="container mx-auto">
        <SectionTitle
          title="Featured Projects"
          subtitle="Showcasing impactful solutions and technical expertise"
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <AnimatedCard className="h-full flex flex-col">
                {/* Project Image */}
                <div className="relative h-48 mb-4 -m-6 mb-4 overflow-hidden rounded-lg">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4 flex-1">
                    {project.description}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.highlights.map((highlight, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                    >
                      <GithubIcon size={16} />
                      <span className="text-sm font-medium">Code</span>
                    </motion.a>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                    >
                      <ExternalLink size={16} />
                      <span className="text-sm font-medium">Demo</span>
                    </motion.a>
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-300 mb-4">Want to see more projects?</p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="https://github.com/robertfanagna"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            <GithubIcon size={20} />
            Visit GitHub
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
