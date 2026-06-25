import { useEffect } from 'react'
import { useThemeStore } from '../../stores/themeStore'

export default function ThemeProvider({ children }) {
  const mode = useThemeStore((s) => s.mode)

  useEffect(() => {
    // Set data-theme on <html> so CSS variables can react
    document.documentElement.setAttribute('data-theme', mode)

    // Also toggle tailwind's dark class
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [mode])

  return children
}
