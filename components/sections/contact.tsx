'use client'

import { SectionTitle } from '../section-title'
import { ScrollReveal } from '../scroll-reveal'
import { AnimatedCard } from '../animated-card'
import { MagneticButton } from '../magnetic-button'
import { useState } from 'react'

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    console.log('Form submitted:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSubmitted(false)
    }, 2000)
  }

  return (
    <section id="contact" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle
          title="Nous Contacter"
          subtitle="Discutons de vos projets ou parlons simplement de technologie et d'innovation"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
          {/* Contact Info */}
          <ScrollReveal direction="left">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Connectons-Nous
                </h3>
                <p className="text-foreground/70">
                  N&apos;hésitez pas à me contacter pour toute demande de collaboration, projet ou simple discussion autour de la technologie et de l&apos;innovation.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: '✉️',
                    label: 'Email',
                    value: 'robertfanagna374@gmail.com',
                    link: 'mailto:robertfanagna374@gmail.com',
                  },
                  {
                    icon: '📱',
                    label: 'Téléphone',
                    value: '+261 34 71 615 82',
                    link: 'tel:+261347161582',
                  },
                  {
                    icon: '📍',
                    label: 'Localisation',
                    value: 'Mahajanga, Madagascar',
                    link: '#',
                  },
                ].map((contact, idx) => (
                  <ScrollReveal key={idx} delay={0.1 * (idx + 1)}>
                    <a
                      href={contact.link}
                      className="flex items-start gap-4 group cursor-pointer"
                    >
                      <span className="text-2xl">{contact.icon}</span>
                      <div>
                        <p className="text-sm text-foreground/60 mb-1">
                          {contact.label}
                        </p>
                        <p className="text-lg text-foreground group-hover:text-primary transition-colors">
                          {contact.value}
                        </p>
                      </div>
                    </a>
                  </ScrollReveal>
                ))}
              </div>

              {/* Social Links */}
              <ScrollReveal delay={0.4}>
                <div className="space-y-4 pt-8 border-t border-foreground/10">
                  <p className="text-sm text-foreground/60">Suivez-moi sur les réseaux</p>
                  <div className="flex gap-4">
                    {[
                      { name: 'GitHub', link: 'https://github.com/robertfanagna', icon: '🐙' },
                      { name: 'LinkedIn', link: 'https://linkedin.com/in/robertfanagna', icon: '💼' },
                      { name: 'Twitter', link: 'https://twitter.com', icon: '𝕏' },
                      { name: 'Email', link: 'mailto:robertfanagna374@gmail.com', icon: '✉️' },
                    ].map((social, idx) => (
                      <a
                        key={idx}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-foreground/5 hover:bg-primary/20 text-foreground hover:text-primary transition-all group"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">
                          {social.icon}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </ScrollReveal>

          {/* Contact Form */}
          <ScrollReveal direction="right">
            <AnimatedCard>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sujet
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Demande de collaboration"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Parlez-moi de votre projet..."
                  />
                </div>

                <MagneticButton variant="primary" className="w-full">
                  {submitted ? 'Message Envoyé! ✓' : 'Envoyer le Message'}
                </MagneticButton>

                {submitted && (
                  <p className="text-sm text-accent text-center">
                    Merci de me contacter. Je vous répondrai bientôt!
                  </p>
                )}
              </form>
            </AnimatedCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
