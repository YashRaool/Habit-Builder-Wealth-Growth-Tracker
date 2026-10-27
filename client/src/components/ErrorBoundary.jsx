import React from 'react';
import Card from './Card';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="max-w-xl mx-auto px-4 py-16 animate-fade-in flex flex-col items-center justify-center">
          <Card padding="p-8" className="w-full text-center flex flex-col items-center gap-4">
            <span className="text-4xl">⚡</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
              Something went wrong
            </h2>
            <p className="text-xs max-w-md" style={{ color: 'var(--muted)', lineHeight: '1.5' }}>
              A temporary issue occurred while rendering this page. You can safely return to the dashboard or try reloading the view.
            </p>
            <div className="flex gap-3 mt-2 w-full max-w-xs">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all active:scale-95"
                style={{ borderColor: 'var(--border)', color: 'var(--ink)', background: 'var(--surface)' }}
              >
                Try Again
              </button>
              <a
                href={import.meta.env.BASE_URL || '/'}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white text-center transition-all active:scale-95"
                style={{ background: 'var(--coral)' }}
              >
                Go to Dashboard
              </a>
            </div>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
