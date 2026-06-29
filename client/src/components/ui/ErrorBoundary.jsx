import { Component } from 'react'

const MAX_RETRIES = 2

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, retryCount: 0 }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Erreur attrapée:', error.message)
  }

  handleReset = () => {
    this.setState(prev => ({ hasError: false, error: null, retryCount: prev.retryCount + 1 }))
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state
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
            {retryCount >= MAX_RETRIES ? '🔁' : '⚠️'}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {retryCount >= MAX_RETRIES ? 'Erreur persistante' : 'Une erreur est survenue'}
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary, #6b7280)',
            marginBottom: '1.5rem',
            maxWidth: '420px',
            lineHeight: 1.5
          }}>
            {retryCount >= MAX_RETRIES
              ? 'L\'erreur persiste après plusieurs tentatives. Veuillez recharger la page pour réinitialiser l\'application.'
              : 'L\'application a rencontré une erreur inattendue. Cliquez ci-dessous pour réessayer.'}
          </p>
          {retryCount >= MAX_RETRIES ? (
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
