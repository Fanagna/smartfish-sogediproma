'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { ThemeToggle } from '../theme-toggle'

const navItems = [
  { label: 'À Propos', href: '#about' },
  { label: 'Expérience', href: '#experience' },
  { label: 'Projets', href: '#projects' },
  { label: 'Compétences', href: '#skills' },
  { label: 'Contact', href: '#contact' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass dark:glass-dark'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <nav className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <motion.div
          className="text-2xl font-bold text-gradient"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          RF
        </motion.div>

        <motion.div
          className="hidden md:flex items-center gap-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </motion.div>

        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {mounted && (
            <Suspense fallback={<div className="w-10 h-10" />}>
              <ThemeToggle />
            </Suspense>
          )}
          <Link
            href="#contact"
            className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors text-sm"
          >
            Nous Contacter
          </Link>
        </motion.div>
      </nav>
    </motion.header>
  )
}
