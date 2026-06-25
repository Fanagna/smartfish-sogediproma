/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand — adjusted for dark mode
        primary: '#3B82F6',
        'primary-dark': '#2563EB',
        'primary-light': '#60A5FA',
        accent: '#00BCD4',
        'accent-dark': '#0097A7',
        'accent-light': '#4DD0E1',
        success: '#00E676',
        'success-dark': '#00C853',
        warning: '#FFD700',
        'warning-dark': '#FFB300',
        danger: '#FF8A80',
        'danger-dark': '#FF5252',

        // Dark theme palette
        dark: {
          deeper: '#070B15',
          base: '#0B1120',
          surface: '#111827',
          elevated: '#1A1D2E',
          card: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(255, 255, 255, 0.12)',
        },

        // Text on dark
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          tertiary: '#64748B',
          muted: '#475569',
        },

        // Light theme palette
        light: {
          deeper: '#F8FAFC',
          base: '#F0F5FF',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          card: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(0, 0, 0, 0.08)',
          'border-light': 'rgba(0, 0, 0, 0.12)',
        },

        // Text on light
        'text-light': {
          primary: '#0F172A',
          secondary: '#475569',
          tertiary: '#64748B',
          muted: '#94A3B8',
        },
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-warm': '0 0 20px rgba(255, 215, 0, 0.15)',
        'glow-cyan': '0 0 20px rgba(0, 188, 212, 0.15)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 48px rgba(0, 0, 0, 0.4)',
        'elevated': '0 20px 60px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'card': '16px',
        'card-sm': '12px',
        'pill': '40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'confetti': 'confetti 1s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'stagger-fade': 'staggerFade 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)' },
        },
        staggerFade: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
    },
  },
  plugins: [],
}
