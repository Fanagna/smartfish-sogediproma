'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: 'Navigation',
      links: [
        { label: 'À Propos', href: '#about' },
        { label: 'Expérience', href: '#experience' },
        { label: 'Projets', href: '#projects' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Compétences', href: '#skills' },
        { label: 'CV', href: '#' },
        { label: 'Plan du Site', href: '#' },
      ],
    },
    {
      title: 'Connexion',
      links: [
        { label: 'GitHub', href: 'https://github.com/Fanagna' },
        { label: 'LinkedIn', href: 'https://linkedin.com/in/robertfanagna' },
        { label: 'Email', href: 'mailto:robertfanagna374@gmail.com' },
      ],
    },
  ]

  return (
    <footer className="relative border-t border-foreground/10 dark:border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6">
        {/* Main Footer Content */}
        <div className="py-16 md:py-20 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Section */}
          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-2xl font-bold text-gradient mb-4">RF</div>
            <p className="text-foreground/60 text-sm leading-relaxed">
              Chef de Projet IT & Développeur Full Stack. Construction de solutions innovantes par la technologie moderne.
            </p>
          </motion.div>

          {/* Footer Links */}
          {footerLinks.map((column, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: (index + 1) * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-foreground font-semibold mb-4">
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-foreground/60 hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-foreground/10 dark:border-white/5" />

        {/* Bottom Footer */}
        <motion.div
          className="py-8 flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-foreground/60 text-sm">
            © {currentYear} Robert Fanagna. Tous droits réservés.
          </p>

          <div className="flex gap-6">
            <Link
              href="#"
              className="text-foreground/60 hover:text-primary transition-colors text-sm"
            >
              Politique de Confidentialité
            </Link>
            <Link
              href="#"
              className="text-foreground/60 hover:text-primary transition-colors text-sm"
            >
              Conditions d&apos;Utilisation
            </Link>
          </div>

          {/* Back to Top Button */}
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-lg bg-foreground/5 dark:bg-white/5 hover:bg-primary/20 flex items-center justify-center text-foreground hover:text-primary transition-all"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            ↑
          </motion.button>
        </motion.div>
      </div>
    </footer>
  )
}
