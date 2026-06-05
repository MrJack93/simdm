import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught:', error, errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Optional: Send to error tracking service (Sentry, etc.)
    if (window.errorTracker) {
      window.errorTracker.captureException(error, {
        context: {
          component: 'ErrorBoundary',
          errorInfo,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Optional: Redirect to home
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          <div
            className="max-w-md w-full rounded-lg p-8 shadow-lg"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="p-4 rounded-full"
                style={{ backgroundColor: 'var(--color-error-bg)' }}
              >
                <AlertTriangle
                  size={32}
                  style={{ color: 'var(--color-error)' }}
                />
              </div>
            </div>

            {/* Error Title */}
            <h1
              className="text-2xl font-bold text-center mb-4"
              style={{ color: 'var(--color-error)' }}
            >
              A apărut o eroare
            </h1>

            {/* Error Message */}
            <p
              className="text-center mb-6 leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Sincer îmi pare rău. O eroare neașteptată s-a produs în aplicație.
              Echipa noastră a fost notificată și o să o rezolve în curând.
            </p>

            {/* Development Error Details */}
            {isDevelopment && this.state.error && (
              <div
                className="mb-6 p-4 rounded-lg text-xs font-mono overflow-auto max-h-48"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  borderLeft: '3px solid var(--color-error)',
                }}
              >
                <p className="font-bold mb-2">Detalii eroare (dev):</p>
                <p className="mb-2">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-bold">Component Stack</summary>
                    <pre className="mt-2 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: 'var(--healthcare-primary)',
                  color: '#fff',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <RefreshCw size={18} />
                Încearcă din nou
              </button>

              <a
                href="/"
                className="w-full py-3 px-4 rounded-lg font-semibold text-center transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Mergi la start
              </a>
            </div>

            {/* Error ID for support */}
            <p
              className="text-center mt-6 text-xs"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              ID eroare: {Date.now()}
              {isDevelopment && ` | Erori: ${this.state.errorCount}`}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for programmatic error handling
export function useErrorHandler() {
  return (error) => {
    throw error;
  };
}
