import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: 'dark', // 'dark' | 'light'

      toggleMode: () => {
        const next = get().mode === 'dark' ? 'light' : 'dark'
        set({ mode: next })
        return next
      },

      setMode: (mode) => {
        set({ mode })
      },
    }),
    {
      name: 'smartfish-theme',
    }
  )
)
