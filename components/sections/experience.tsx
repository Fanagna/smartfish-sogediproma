'use client'

import { SectionTitle } from '../section-title'
import { ScrollReveal } from '../scroll-reveal'
import { AnimatedCard } from '../animated-card'
import { AnimatedBadge } from '../animated-badge'

const experiences = [
  {
    role: 'Responsable SI & Développeur Full Stack Lead',
    company: 'SOGEDIPROMA',
    period: '2025 - Présent',
    description:
      'Pilotage du SI & Cybersécurité. Réduction de 25% des incidents techniques. Projet stratégique "SmartFish Decision AI": digitalisation 100% des processus métiers et accélération de 40% du temps de prise de décision managériale. Design UX/UI moderne du site web institutionnel.',
    highlights: ['Architecture Logicielle', 'Gestion SI', 'IA/ML', 'Next.js', 'PostgreSQL', 'Sécurité'],
  },
  {
    role: 'Analyste de Marché & Trader Forex Indépendant',
    company: 'Activité Indépendante',
    period: '2023 - Présent',
    description:
      'Gestion des risques quantitatifs et stratégies de préservation du capital. Analyse macroéconomique avancée. Trading avec discipline comportementale de haut niveau dans des environnements volatiles.',
    highlights: ['Risk Management', 'Analyse Technique', 'Fintech', 'Gestion de Capital', 'Trading'],
  },
  {
    role: 'Technicien Informatique & Développeur Web',
    company: 'SOGEDIPROMA',
    period: 'Octobre 2024 - Novembre 2024',
    description:
      'Support technique et développement d&apos;une application Web de gestion de parc informatique avec tableau de bord en temps réel. Diagnostic matériel/logiciel complet.',
    highlights: ['React', 'Node.js', 'CRUD', 'Dashboard', 'Gestion Parc IT'],
  },
  {
    role: 'Technicien Informatique & Gestion de Données',
    company: 'DIREED (Direction Interrégionale de l&apos;Environnement)',
    period: 'Septembre 2023 - Novembre 2023',
    description:
      'Modernisation des processus administratifs via implémentation d&apos;un système de Gestion Documentaire Numérique (GED). Support technique et administration de bases de données.',
    highlights: ['GED', 'Administration BD', 'Support Technique', 'Services Publics'],
  },
]

export function Experience() {
  return (
    <section id="experience" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title="Expérience Professionnelle"
          subtitle="Un parcours de croissance, d'apprentissage et de création de solutions impactantes"
        />

        <div className="space-y-8 md:space-y-12">
          {experiences.map((exp, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <AnimatedCard>
                <div className="md:flex justify-between items-start gap-8">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                          {exp.role}
                        </h3>
                        <p className="text-primary font-medium">{exp.company}</p>
                      </div>
                      <span className="text-sm text-foreground/60 whitespace-nowrap ml-4">
                        {exp.period}
                      </span>
                    </div>

                    <p className="text-foreground/80 mb-6 leading-relaxed">
                      {exp.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {exp.highlights.map((highlight, idx) => (
                        <AnimatedBadge key={idx} variant="default" delay={0.1 * idx}>
                          {highlight}
                        </AnimatedBadge>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
