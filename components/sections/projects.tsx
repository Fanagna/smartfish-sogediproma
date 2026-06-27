'use client'

import { SectionTitle } from '../section-title'
import { ScrollReveal } from '../scroll-reveal'
import { AnimatedCard } from '../animated-card'
import { AnimatedBadge } from '../animated-badge'
import Link from 'next/link'

const projects = [
  {
    title: 'SmartFish Decision AI',
    description:
      'Plateforme d\'aide à la décision stratégique pour l\'optimisation de la stratégie d\'entreprise. Intégration de modules algorithmiques avancés et digitalisation 100% des processus métiers critiques.',
    image: '🎯',
    tags: ['Next.js', 'TypeScript', 'IA/ML', 'PostgreSQL', 'Dashboard'],
    link: '#',
    stats: '+40% Accélération Décisions',
  },
  {
    title: 'Plateforme Gestion Parc IT',
    description:
      'Application Web de gestion et suivi en temps réel des actifs technologiques. CRUD complet avec tableau de bord intuitif pour l\'administration informatique.',
    image: '💻',
    tags: ['React', 'Node.js', 'Express', 'MongoDB', 'Dashboard Temps Réel'],
    link: '#',
    stats: 'Gestion 500+ Actifs',
  },
  {
    title: 'Système Gestion Documentaire (GED)',
    description:
      'Modernisation des processus administratifs via implémentation d\'une GED pour services publics. Digitalisation complète avec indexation et archivage.',
    image: '📄',
    tags: ['GED', 'Administration Publique', 'Archivage', 'Indexation', 'Workflow'],
    link: '#',
    stats: '10K+ Documents Gérés',
  },
  {
    title: 'Analyse Marchés Forex',
    description:
      'Système d\'analyse macroéconomique avancée avec modélisation des tendances financières mondiales. Gestion des risques quantitatifs optimisée.',
    image: '📈',
    tags: ['Fintech', 'Risk Management', 'Analyse Technique', 'Trading', 'Python'],
    link: '#',
    stats: 'Stratégie Capital Safe',
  },
  {
    title: 'Architecture SI Scalable',
    description:
      'Conception et déploiement d\'architectures logicielles modernes pour l\'entreprise. Focus sur la sécurité, la maintenabilité et la performance.',
    image: '🏗️',
    tags: ['Architecture', 'UML', 'Gestion SI', 'Cybersécurité', 'Scalabilité'],
    link: '#',
    stats: 'Réduction Incidents -25%',
  },
  {
    title: 'Site Web Institutionnel',
    description:
      'Design UX/UI moderne et responsive avec optimisation SEO avancée. Hausse significative de l\'engagement numérique et présence web.',
    image: '🌐',
    tags: ['Next.js', 'Tailwind CSS', 'SEO', 'UX/UI Design', 'Performance'],
    link: '#',
    stats: 'Engagement +60%',
  },
]

export function Projects() {
  return (
    <section id="projects" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title="Projets Phares"
          subtitle="Solutions innovantes construites pour transformer les métiers et optimiser les processus"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {projects.map((project, index) => (
            <ScrollReveal key={index} delay={index * 0.05}>
              <AnimatedCard className="h-full flex flex-col">
                <div className="text-4xl mb-4">{project.image}</div>

                <h3 className="text-xl font-bold text-foreground mb-3">
                  {project.title}
                </h3>

                <p className="text-foreground/70 text-sm md:text-base flex-1 mb-4">
                  {project.description}
                </p>

                <div className="mb-4 pb-4 border-b border-white/10">
                  <p className="text-xs text-accent font-medium">
                    {project.stats}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.slice(0, 3).map((tag, idx) => (
                    <AnimatedBadge
                      key={idx}
                      variant="default"
                      delay={0.05 * idx}
                    >
                      {tag}
                    </AnimatedBadge>
                  ))}
                  {project.tags.length > 3 && (
                    <AnimatedBadge variant="default">
                      +{project.tags.length - 3} more
                    </AnimatedBadge>
                  )}
                </div>

                <Link
                  href={project.link}
                  className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                >
                  View Project →
                </Link>
              </AnimatedCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
