'use client'

import { SectionTitle } from '../common/section-title'
import { MagneticButton } from '../common/magnetic-button'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone } from 'lucide-react'
import { FormEvent, useState } from 'react'

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setSubmitStatus('success')
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setSubmitStatus('idle'), 3000)
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <section id="contact" className="py-20 px-4">
      <div className="container mx-auto">
        <SectionTitle
          title="Let&apos;s Connect"
          subtitle="Have a project in mind or want to discuss opportunities? I&apos;d love to hear from you."
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            viewport={{ once: true }}
            className="glass p-6 rounded-lg flex items-start gap-4"
          >
            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Location</h3>
              <p className="text-gray-300">Mahajanga, Madagascar</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="glass p-6 rounded-lg flex items-start gap-4"
          >
            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Email</h3>
              <a
                href="mailto:robertfanagna374@gmail.com"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                robertfanagna374@gmail.com
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="glass p-6 rounded-lg flex items-start gap-4"
          >
            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400">
              <Phone size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Phone</h3>
              <a
                href="tel:+261347161582"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                +261 34 71 615 82
              </a>
            </div>
          </motion.div>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto glass p-8 rounded-lg"
        >
          <h3 className="text-2xl font-bold text-white mb-6">Send a Message</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Your email"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Your message"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
              />
            </motion.div>

            {/* Status Message */}
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300"
              >
                Message sent successfully! I&apos;ll get back to you soon.
              </motion.div>
            )}

            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300"
              >
                Error sending message. Please try again.
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <MagneticButton
                variant="primary"
                className="w-full justify-center"
                onClick={() => {}}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </MagneticButton>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
