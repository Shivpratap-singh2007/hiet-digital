// =============================================================================
// HIET DIGITAL CAMPUS — INSTITUTIONAL ERROR BOUNDARY
// Prevents unhandled React rendering crashes from showing an endless blank screen
// =============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class InstitutionalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected runtime error occurred'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[HIET Digital Campus] Uncaught application exception:', error, errorInfo);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleResetToLogin = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('hiet_current_user');
        localStorage.removeItem('hiet_active_workspace_role');
        sessionStorage.removeItem('hiet_session_token');
        sessionStorage.removeItem('hiet_auth_token');
      } catch {}
      window.location.href = '/login';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 p-6 sm:p-8 text-center">
            {/* Branded HIET Crest */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white border border-slate-200 shadow-md p-2 flex items-center justify-center">
              <img
                src="/images/hiet_crest.png"
                alt="HIET Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-3">
              <AlertTriangle className="w-3.5 h-3.5" />
              Startup Recovery
            </div>

            <h2 className="text-lg font-bold text-[#0f2942] mb-1.5">
              Unable to load digital workspace
            </h2>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              The application encountered an unexpected issue during initialization. You can reload or reset your session to return to the sign-in portal.
            </p>

            {this.state.errorMessage && (
              <details className="mt-2 mb-6 text-left border border-slate-200/90 rounded-xl bg-slate-50/80 p-3 group">
                <summary className="text-[11px] font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-800 flex items-center justify-between">
                  <span>Diagnostic Details {Boolean(import.meta.env.DEV) ? '(Development)' : ''}</span>
                  <span className="text-[10px] text-slate-400 group-open:hidden">Show</span>
                </summary>
                <div className="mt-2 pt-2 border-t border-slate-200/80">
                  <p className="text-[11px] font-mono text-rose-600 break-words whitespace-pre-wrap leading-relaxed">
                    {this.state.errorMessage}
                  </p>
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0f2942] hover:bg-[#163a5d] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleResetToLogin}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Reset & Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
