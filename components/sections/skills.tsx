'use client'

import { SectionTitle } from '../section-title'
import { ScrollReveal } from '../scroll-reveal'
import { AnimatedCard } from '../animated-card'

const skillCategories = [
  {
    title: 'Frontend',
    icon: '🎨',
    skills: ['JavaScript (ES6+)', 'React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'HTML5', 'CSS3'],
  },
  {
    title: 'Backend',
    icon: '⚙️',
    skills: ['Node.js', 'Express.js', 'Python', 'PHP', 'C#', 'VB.NET', 'GraphQL'],
  },
  {
    title: 'Bases de Données',
    icon: '🗄️',
    skills: ['PostgreSQL', 'MySQL', 'SQL Server', 'MongoDB', 'Firebase', 'Supabase'],
  },
  {
    title: 'DevOps & Systèmes',
    icon: '☁️',
    skills: ['Docker', 'Kubernetes', 'GitHub', 'Git', 'Administration SI', 'Sécurité Informatique'],
  },
  {
    title: 'IA & Fintech',
    icon: '🤖',
    skills: ['Intelligence Artificielle', 'Algorithmique Financière', 'Trading', 'Risk Management', 'Cryptographie'],
  },
  {
    title: 'Outils & Élite',
    icon: '🛠️',
    skills: ['Cursor', 'Claude AI', 'MetaTrader 4/5', 'TradingView', 'Jira', 'Notion'],
  },
]

export function Skills() {
  return (
    <section id="skills" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title="Compétences & Expertises"
          subtitle="Un arsenal complet pour la conception d'architectures logicielles et la gouvernance SI"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {skillCategories.map((category, index) => (
            <ScrollReveal key={index} delay={index * 0.05}>
              <AnimatedCard>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{category.icon}</span>
                  <h3 className="text-xl font-bold text-foreground">
                    {category.title}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </AnimatedCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Proficiency Levels */}
        <div className="mt-16 md:mt-20">
          <ScrollReveal>
            <AnimatedCard>
              <h3 className="text-2xl font-bold text-foreground mb-8">
                Niveaux de Maîtrise
              </h3>

              <div className="space-y-6">
                {[
                  {
                    category: 'Avancé',
                    items: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Gestion Projet', 'SI'],
                    level: 95,
                  },
                  {
                    category: 'Intermédiaire',
                    items: ['Python', 'Architecture Logicielle', 'Docker', 'Risk Management', 'IA'],
                    level: 85,
                  },
                  {
                    category: 'Compétent',
                    items: ['Kubernetes', 'Fintech', 'Trading', 'Algorithmique', 'C#'],
                    level: 75,
                  },
                ].map((proficiency, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">
                        {proficiency.category}
                      </span>
                      <span className="text-sm text-foreground/60">
                        {proficiency.level}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-violet-600 rounded-full"
                        style={{ width: `${proficiency.level}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground/50 mt-2">
                      {proficiency.items.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
