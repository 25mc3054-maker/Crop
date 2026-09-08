import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Krishi-Net UI Caught Error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.hash = '#/dashboard'
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="hero-card" style={{ maxWidth: 540, background: '#e8f9ee', border: '2px solid #16a34a', padding: 32, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#fee2e2', color: '#b91c1c', border: '1px solid #ef4444', padding: '4px 12px', fontSize: 12, fontWeight: 900, marginBottom: 16 }}>
              ⚠️ INTERFACE RECOVERY SYSTEM
            </div>
            <h2 style={{ color: '#000000', fontSize: 24, fontWeight: 900, marginBottom: 12 }}>
              Agricultural Portal Recovered
            </h2>
            <p style={{ color: '#1f2937', fontSize: 14, marginBottom: 20 }}>
              {this.state.error?.message || 'A module error was caught and prevented from blanking the screen.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={this.handleReset} 
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: 14, fontWeight: 800 }}
              >
                🔄 Reload & Return to Dashboard
              </button>
              <button 
                onClick={() => { localStorage.clear(); window.location.hash = '#/'; window.location.reload(); }} 
                className="btn btn-ghost"
                style={{ padding: '12px 24px', fontSize: 14, fontWeight: 800, color: '#000000', borderColor: '#000000' }}
              >
                Reset Session & Login
              </button>
            </div>
          </div>
        </section>
      )
    }

    return this.props.children
  }
}
