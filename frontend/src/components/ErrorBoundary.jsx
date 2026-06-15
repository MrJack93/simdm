import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;

      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          <div
            className="max-w-md w-full rounded-xl p-8"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-error-bg)' }}
              >
                <AlertTriangle size={32} style={{ color: 'var(--color-error)' }} />
              </div>
            </div>

            <h1
              className="text-2xl font-medium text-center mb-4"
              style={{
                fontFamily: 'var(--font-family-heading)',
                color: 'var(--color-error)',
              }}
            >
              A apărut o eroare
            </h1>

            <p
              className="text-center mb-6 leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              O eroare neașteptată s-a produs în aplicație. Încearcă din nou.
            </p>

            {isDevelopment && this.state.error && (
              <div
                className="mb-6 p-4 rounded-lg text-xs font-mono overflow-auto max-h-48"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  borderLeft: '3px solid var(--color-error)',
                }}
              >
                <p className="font-medium mb-2">Detalii eroare (dev):</p>
                <p className="mb-2">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Component Stack</summary>
                    <pre className="mt-2 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Încearcă din nou
              </button>

              <a
                href="/"
                className="w-full btn-secondary text-center block"
              >
                Mergi la start
              </a>
            </div>

            <p
              className="text-center mt-6 text-xs"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              ID eroare: {Date.now()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function useErrorHandler() {
  return (error) => { throw error; };
}
