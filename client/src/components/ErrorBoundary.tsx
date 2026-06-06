import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-screen bg-surface-0 text-primary p-6 md:p-8">
          <div className="max-w-md w-full text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-warn/10 border border-warn/20 flex items-center justify-center text-warn">
              <AlertTriangle className="w-8 h-8" aria-hidden="true" />
            </div>
            <h1 className="text-xl-fluid font-bold">Something went wrong</h1>
            <p className="text-sm text-secondary">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="touch-target inline-flex items-center gap-2 px-6 py-2.5 bg-mesh hover:bg-mesh/90 text-surface-0 font-semibold rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="touch-target inline-flex items-center gap-2 px-6 py-2.5 bg-surface-2 hover:bg-surface-3 text-primary text-sm rounded-lg transition-colors border border-default"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
