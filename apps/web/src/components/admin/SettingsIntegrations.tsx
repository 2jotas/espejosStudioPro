import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, ExternalLink, RefreshCw, MessageSquare, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SettingsIntegrations() {
  const { refetchUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for postMessage from Google OAuth popup window
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setIsConnected(true);
        await refetchUser();
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        alert(event.data.message || 'Error en la conexión con Google');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetchUser]);

  const handleConnectGoogle = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/calendar/auth-url');
      if (!res.ok) throw new Error('Error al obtener la URL de autenticación');
      const data = await res.json();

      // Open OAuth popup window
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        data.url,
        'GoogleCalendarAuth',
        `width=${width},height=${height},top=${top},left=${left}`
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('¿Deseas desconectar tu cuenta de Google Calendar?')) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/calendar/disconnect', { method: 'POST' });
      if (res.ok) {
        setIsConnected(false);
        await refetchUser();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white">Configuración e Integraciones</h2>
        <p className="text-slate-400 text-sm">Conecta tus herramientas externas para automatizar tu agenda y comunicaciones</p>
      </div>

      {/* Integrations List Grid */}
      <div className="space-y-4">
        {/* Google Calendar Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 backdrop-blur-xl">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-500 p-[1px] flex-shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-bold text-white">Google Calendar</h3>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isConnected ? 'Sincronizado' : 'No Conectado'}
                </span>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
                Bloquea automáticamente en tu página de reserva los horarios que ya tengas ocupados en tu Google Calendar personal o de trabajo.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex-shrink-0">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs text-emerald-400 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Activo</span>
                </span>
                <button
                  onClick={handleDisconnectGoogle}
                  disabled={isLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Conectar Google Calendar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* WhatsApp Reminders Placeholder (Future Integration) */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 opacity-75">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-bold text-white">Recordatorios WhatsApp 24h</h3>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Próximamente (Plan Pro)
                </span>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
                Envía confirmaciones y recordatorios automáticos por WhatsApp a tus clientes 24 horas antes de su cita para reducir las inasistencias.
              </p>
            </div>
          </div>
        </div>

        {/* General Settings Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 mt-8">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
            <Sliders className="w-4 h-4" />
            <span>Preferencia de Horario Laboral</span>
          </div>

          <p className="text-slate-400 text-xs">
            Horario predeterminado para el cálculo de disponibilidad de tus citas:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md pt-2">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 block">Hora de inicio</span>
              <span className="text-white font-bold text-sm">09:00 AM</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 block">Hora de término</span>
              <span className="text-white font-bold text-sm">07:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
