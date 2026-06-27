import { AnimatedGrid } from '@/components/animated-grid'
import { Navbar } from '@/components/sections/navbar'
import { Hero } from '@/components/sections/hero'
import { About } from '@/components/sections/about'
import { Experience } from '@/components/sections/experience'
import { Projects } from '@/components/sections/projects'
import { Skills } from '@/components/sections/skills'
import { Contact } from '@/components/sections/contact'
import { Footer } from '@/components/sections/footer'

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <AnimatedGrid />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Contact />
        <Footer />
      </div>
    </main>
  )
}
