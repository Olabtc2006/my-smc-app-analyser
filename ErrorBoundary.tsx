import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, ShieldAlert, KeyRound } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Standard React Error Boundary component designed to catch rendering exceptions,
 * preventing total app crash and displaying an elegant diagnostic terminal fallback.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SMC Error Boundary Caught exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="p-8 bg-slate-950/90 border border-red-500/25 rounded-3xl text-center space-y-6 max-w-xl mx-auto my-12 backdrop-blur-md shadow-2xl relative overflow-hidden font-sans"
          role="alert"
          aria-live="assertive"
        >
          {/* Cyber accents */}
          <div className="absolute top-0 left-0 w-12 h-1 bg-red-500/60" />
          <div className="absolute top-0 left-0 w-1 h-12 bg-red-500/60" />
          
          <div className="flex justify-center">
            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 animate-pulse">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-white">
              {this.props.fallbackTitle || 'Terminal Shield Engaged'}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              An unexpected execution anomaly has been isolated in this layout block. The core system remains secure and isolated.
            </p>
          </div>

          {this.state.error && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left max-h-40 overflow-y-auto">
              <div className="flex items-center gap-1.5 mb-2 text-rose-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Exception Logs</span>
              </div>
              <p className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap break-all leading-normal">
                {this.state.error.message || String(this.state.error)}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={this.handleReset}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.handleReset(); } }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 hover:text-sky-300 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              aria-label="Re-initialize layout block"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Component</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.reload(); } }}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              aria-label="Reboot entire system layout"
            >
              <KeyRound className="w-4 h-4 text-slate-950" />
              <span>Hard Reboot</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
