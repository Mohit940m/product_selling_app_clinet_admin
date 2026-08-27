import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level render-error catch. Without this, an unhandled error thrown
 * during render anywhere in the tree white-screens the whole app with no
 * way back short of a manual URL edit. React error boundaries must be
 * class components — there's no hook equivalent (componentDidCatch has
 * no hook form as of React 19).
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <p className="font-mono text-[11px] font-bold text-muted">SOMETHING WENT WRONG</p>
          <h1 className="font-black text-[22px] leading-[1.1] tracking-[-.03em] text-ink">This page hit an unexpected error</h1>
          <p className="max-w-[360px] text-sm text-muted">
            Try reloading the page. If the problem keeps happening, the details are in your browser console.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-btn bg-ink px-5 py-3 text-sm font-extrabold text-card t-fast hover:shadow-lift-ink"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
