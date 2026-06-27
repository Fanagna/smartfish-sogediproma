'use client'

import { SectionTitle } from '../section-title'
import { ScrollReveal } from '../scroll-reveal'
import { AnimatedCard } from '../animated-card'
import { ProfileImage } from '../profile-image'

export function About() {
  return (
    <section id="about" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title="À Propos"
          subtitle="Professionnel des Technologie de l'Information doté de 3+ ans d'expérience dans la conception d'architectures logicielles"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left - Profile Image */}
          <ScrollReveal direction="left">
            <ProfileImage />
          </ScrollReveal>

          {/* Right - Content */}
          <div className="space-y-6">
            <ScrollReveal direction="right" delay={0.1}>
              <div className="space-y-6">
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Je suis Robert Fanagna, Chef de Projet IT et Développeur Full Stack avec 3+ ans d&apos;expérience professionnelle. Je me spécialise dans la fusion entre l&apos;ingénierie logicielle et l&apos;analyse de données quantitatives en Fintech & IA.
                </p>

                <p className="text-lg text-foreground/80 leading-relaxed">
                  Mon parcours a débuté par une passion pour la résolution de problèmes complexes par la programmation. Au fil des années, j&apos;ai évolué vers un rôle de leader technique, pilotant des équipes tout en maintenant une expertise en développement. Je crois en la création de solutions élégantes et performantes.
                </p>

                <p className="text-lg text-foreground/80 leading-relaxed">
                  Basé à Mahajanga, Madagascar, j&apos;explore continuellement les technologies émergentes et contribue activement à des projets innovants. Ma culture d&apos;innovation me pousse à repousser les limites de ce qui est possible en technologie.
                </p>

                {/* Highlighted Stats */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="glass dark:glass-dark rounded-lg p-4">
                    <div className="text-2xl font-bold text-gradient">20+</div>
                    <p className="text-sm text-foreground/60 mt-1">Projets Livrés</p>
                  </div>
                  <div className="glass dark:glass-dark rounded-lg p-4">
                    <div className="text-2xl font-bold text-gradient">10+</div>
                    <p className="text-sm text-foreground/60 mt-1">Membres d&apos;Équipe</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Expertise Cards */}
            <div className="space-y-4 pt-4">
              <ScrollReveal direction="right" delay={0.2}>
                <AnimatedCard>
                  <div className="text-gradient text-lg font-bold mb-3">
                    💻 Développement Full Stack
                  </div>
                  <p className="text-foreground/70">
                    Expert en React, Node.js et Next.js. Construction d&apos;applications production-ready avec les outils modernes et les meilleures pratiques.
                  </p>
                </AnimatedCard>
              </ScrollReveal>

              <ScrollReveal direction="right" delay={0.3}>
                <AnimatedCard>
                  <div className="text-gradient text-lg font-bold mb-3">
                    🏢 Leadership Technique
                  </div>
                  <p className="text-foreground/70">
                    Pilotage d&apos;équipes de développement avec focus sur l&apos;architecture, la gouvernance SI et la création de valeur métier par la technologie.
                  </p>
                </AnimatedCard>
              </ScrollReveal>

              <ScrollReveal direction="right" delay={0.4}>
                <AnimatedCard>
                  <div className="text-gradient text-lg font-bold mb-3">
                    🚀 Innovation & IA
                  </div>
                  <p className="text-foreground/70">
                    Passionné par l&apos;IA, la Fintech et les technologies émergentes. Veille constante et apprentissage continu des dernières tendances du marché.
                  </p>
                </AnimatedCard>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
