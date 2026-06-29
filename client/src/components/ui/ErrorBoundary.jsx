import { Component } from 'react'

const MAX_RETRIES = 2
const RELOAD_DELAY_MS = 3000

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, retryCount: 0, reloading: false, progress: 100 }
    this.reloadTimer = null
    this.progressTimer = null
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    console.error('[ErrorBoundary] Erreur attrapée:', error.message)

    // Auto-reload on DOM corruption errors - React can't recover
    if (
      !this.reloadTimer &&
      error.name === 'NotFoundError' &&
      (error.message.includes('removeChild') || error.message.includes('insertBefore'))
    ) {
      this.setState({ reloading: true, progress: 100 })
      this.reloadTimer = setTimeout(() => {
        window.location.reload()
      }, RELOAD_DELAY_MS)
      // Décrémente la barre de progression toutes les 100ms
      const steps = RELOAD_DELAY_MS / 100
      this.progressTimer = setInterval(() => {
        this.setState(prev => ({ progress: Math.max(0, prev.progress - 100 / steps) }))
      }, 100)
    }
  }

  componentWillUnmount() {
    if (this.reloadTimer) clearTimeout(this.reloadTimer)
    if (this.progressTimer) clearInterval(this.progressTimer)
  }

  handleReset = () => {
    this.setState(prev => ({ hasError: false, error: null, retryCount: prev.retryCount + 1 }))
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { retryCount, reloading, progress } = this.state
      const isDomError = reloading

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-base, #f5f5f7)',
          color: 'var(--text-primary, #1a1d2e)',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {isDomError ? '🔄' : retryCount >= MAX_RETRIES ? '🔁' : '⚠️'}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {isDomError
              ? 'Rechargement en cours...'
              : retryCount >= MAX_RETRIES
                ? 'Erreur persistante'
                : 'Une erreur est survenue'}
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary, #6b7280)',
            marginBottom: '1.5rem',
            maxWidth: '420px',
            lineHeight: 1.5
          }}>
            {isDomError
              ? "L'application va être rechargée automatiquement..."
              : retryCount >= MAX_RETRIES
                ? "L'erreur persiste après plusieurs tentatives. Veuillez recharger la page."
                : "L'application a rencontré une erreur inattendue. Cliquez ci-dessous pour réessayer."}
          </p>
          {isDomError ? (
            <div style={{
              width: '200px',
              height: '4px',
              background: 'var(--border-default, #e5e7eb)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--color-primary, #6366f1)',
                transition: 'width 100ms linear',
                borderRadius: '2px'
              }} />
            </div>
          ) : retryCount >= MAX_RETRIES ? (
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.75rem 2rem',
                background: 'var(--color-primary, #6366f1)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              Recharger la page
            </button>
          ) : (
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 2rem',
                background: 'var(--color-primary, #6366f1)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              Réessayer
            </button>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
