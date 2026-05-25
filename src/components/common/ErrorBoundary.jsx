import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-gradient-to-b from-gray-50 to-indigo-50">
          <div className="text-5xl">⚠️</div>
          <h1 className="font-display text-gray-900 text-[2rem] font-semibold">
            Something went wrong
          </h1>
          <p className="text-gray-600 max-w-[400px] leading-relaxed">
            An unexpected error occurred. Please refresh the page or go back to the dashboard.
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => window.location.reload()}
              className="btn-glow"
            >
              ↺ Refresh
            </button>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}
              className="btn-glow"
            >
              ← Dashboard
            </button>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-4 text-[0.72rem] text-gray-600 max-w-[600px] text-left whitespace-pre-wrap bg-red-500/5 p-4 rounded-lg border border-red-500/10">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}