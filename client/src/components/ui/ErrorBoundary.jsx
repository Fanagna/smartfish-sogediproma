import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('[ErrorBoundary] Erreur attrapée:', error.message)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Une erreur est survenue
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary, #6b7280)',
            marginBottom: '1.5rem',
            maxWidth: '400px'
          }}>
            Cliquez sur le bouton ci-dessous pour réessayer.
          </p>
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
        </div>
      )
    }
    return this.props.children
  }
}
