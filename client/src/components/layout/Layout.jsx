import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    // Initialize based on screen size
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Auto-close sidebar when resizing to mobile
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
