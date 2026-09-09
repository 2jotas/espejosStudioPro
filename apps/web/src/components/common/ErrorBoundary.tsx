import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Algo no cargó correctamente</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Ocurrió un error inesperado al renderizar esta sección. Puedes recargar la página para intentarlo nuevamente.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 text-left overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Página</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Ir al Inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
