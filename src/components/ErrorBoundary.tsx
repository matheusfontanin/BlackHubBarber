import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0 -mt-8 -mx-8 mb-6" />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5">
            <AlertTriangle className="text-gold" size={28} />
          </div>
          <h2 className="text-2xl font-heading font-bold italic text-primary mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-muted mb-6">
            Nosso time foi avisado. Tente novamente ou volte ao painel.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-[11px] font-mono text-faint bg-surface/60 border border-border rounded-lg p-3 mb-6 overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleReset}
              className="btn-gold flex-1 flex items-center justify-center gap-2 py-3"
            >
              <RefreshCw size={16} /> Tentar novamente
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex-1 bg-surface/60 hover:bg-surface border border-border text-primary rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
            >
              <Home size={16} /> Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
