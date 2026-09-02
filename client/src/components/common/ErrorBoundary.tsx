import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Nivara ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-[600px] mx-auto p-6 my-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/50 shadow-sm flex flex-col items-center text-center gap-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/40 flex items-center justify-center text-2xl">
            🌿
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-headline font-bold text-lg text-on-background">
              {this.props.fallbackTitle || 'Taking a mindful pause'}
            </h2>
            <p className="text-xs text-on-surface-variant max-w-sm">
              We encountered a slight hiccup rendering this section. Your personal data is completely safe.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm"
            >
              Refresh View
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-variant transition-colors"
            >
              Reload Space
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
