import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Robert Fanagna | Chef de Projet IT & Développeur Full Stack',
  description:
    'Portfolio premium de Robert Fanagna - Chef de Projet IT, Responsable SI et Développeur Full Stack spécialisé en Fintech & IA. 3+ années d\'expérience.',
  keywords:
    'Chef de Projet IT, Développeur Full Stack, Fintech, IA, React, Node.js, Next.js, Python, PostgreSQL, TypeScript, Mahajanga',
  authors: [{ name: 'Robert Fanagna' }],
  creator: 'Robert Fanagna',
  publisher: 'Robert Fanagna',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://robertfanagna.dev',
    siteName: 'Robert Fanagna Portfolio',
    title: 'Robert Fanagna | Chef de Projet IT & Développeur Full Stack',
    description:
      'Portfolio premium - Expert en architecture logicielle, gouvernance SI et transformation digitale',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09090B' },
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Robert Fanagna',
    url: 'https://robertfanagna.dev',
    jobTitle: 'Chef de Projet IT | Responsable SI | Développeur Full Stack',
    description:
      'Expert en architecture logicielle, gouvernance SI et transformation digitale spécialisé en Fintech et IA',
    areaServed: 'Madagascar',
    worksFor: {
      '@type': 'Organization',
      name: 'SOGEDIPROMA',
    },
    knowsAbout: [
      'React',
      'Next.js',
      'Node.js',
      'TypeScript',
      'Python',
      'PostgreSQL',
      'Fintech',
      'IA',
      'Gestion de Projet',
      'Systèmes d\'Information',
    ],
    sameAs: [
      'https://github.com/Fanagna',
      'https://linkedin.com/in/robertfanagna',
    ],
  }

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
