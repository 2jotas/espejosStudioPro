import { useState, useEffect } from 'react';
import { Sparkles, Calendar, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { HealthCheckResponse } from '@espejos/shared-types';

export default function App() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline', db: 'error', redis: 'error', timestamp: new Date().toISOString() }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Espejos
          </span>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
          <span className={`h-2 w-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-slate-400">API Status:</span>
          <span className="text-slate-200 uppercase font-semibold">{health?.status || 'checking...'}</span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto text-center py-16">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fase 0 — Setup Inicial Completado</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Refleja tu mejor versión con <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Espejos</span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          El CRM de agendamiento inteligente y ficha de clientes diseñado para profesionales de la belleza, estética y cuidado personal.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left mb-12">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <Calendar className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Agendamiento 1-Tap</h3>
            <p className="text-xs text-slate-400">Página de reserva pública hiper-rápida y sincronizada con tu agenda.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <Users className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Ficha de Cliente</h3>
            <p className="text-xs text-slate-400">Historial de visitas, preferencias, notas técnicas y etiquetas VIP.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Passkeys & WebAuthn</h3>
            <p className="text-xs text-slate-400">Reserva en 1 segundo con Face ID / Huella digital sin contraseñas.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2">
            <span>Iniciar Fase 1</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center text-xs text-slate-500 border-t border-slate-900 pt-6">
        <p>Espejos Studio &copy; {new Date().getFullYear()} — Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
