import { useState, useEffect } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  RefreshCw, 
  MessageSquare, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Key, 
  QrCode, 
  Bot, 
  Send, 
  Save, 
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SettingsIntegrations() {
  const { user, refetchUser } = useAuth();

  // Profile Edit State
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [slug, setSlug] = useState(user?.slug || '');
  const [bio, setBio] = useState('');
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(true);
  const [slugReason, setSlugReason] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const presets = [
    'Especialistas en cortes a la medida, visagismo y cuidado personal. Refleja tu mejor versión.',
    'Asesores de imagen & estética profesional. Diseños exclusivos de barba, corte y tratamientos capilares.',
    'Experiencia de barbería & salón boutique. Atención personalizada orientada al detalle y la precisión.',
  ];

  // Google Calendar Integration State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'apikey' | 'oauth'>('apikey');
  const [calendarId, setCalendarId] = useState(user?.email || '');
  const [apiKey, setApiKey] = useState('');
  const [isConnectingApiKey, setIsConnectingApiKey] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // WhatsApp Bot & Gateway State
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [whatsappBotEnabled, setWhatsappBotEnabled] = useState(true);
  const [whatsappTone, setWhatsappTone] = useState<'cercano' | 'profesional' | 'directo'>('cercano');
  const [whatsappCustomPrompt, setWhatsappCustomPrompt] = useState('');
  const [whatsappFewShotExamples, setWhatsappFewShotExamples] = useState('');
  const [whatsappReminderHours, setWhatsappReminderHours] = useState(2);
  const [isWhatsappQrOpen, setIsWhatsappQrOpen] = useState(false);
  const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null);
  const [isConnectingWhatsapp, setIsConnectingWhatsapp] = useState(false);
  const [isSavingWhatsappSettings, setIsSavingWhatsappSettings] = useState(false);
  const [whatsappSaveMessage, setWhatsappSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // WhatsApp Simulator Chat
  const [simMessage, setSimMessage] = useState('');
  const [simHistory, setSimHistory] = useState<Array<{ role: 'user' | 'bot'; text: string }>>([
    { role: 'bot', text: '¡Hola bro! 💈 ¿En qué te puedo ayudar hoy? ¿Te agendamos un corte o barba?' }
  ]);
  const [isSimLoading, setIsSimLoading] = useState(false);

  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Sync user state when loaded
  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName);
      setSlug(user.slug);
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('espejos_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Load WhatsApp Settings on mount
  useEffect(() => {
    fetch('/api/whatsapp/status', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setIsWhatsappConnected(Boolean(data.connected));
          if (data.botEnabled !== undefined) setWhatsappBotEnabled(Boolean(data.botEnabled));
          if (data.tone) setWhatsappTone(data.tone);
          if (data.customPrompt) setWhatsappCustomPrompt(data.customPrompt);
          if (data.fewShotExamples) setWhatsappFewShotExamples(data.fewShotExamples);
          if (data.reminderHours) setWhatsappReminderHours(data.reminderHours);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced Slug Availability Checker
  useEffect(() => {
    if (!slug || slug === user?.slug) {
      setIsSlugAvailable(true);
      setSlugReason(null);
      return;
    }

    setIsCheckingSlug(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setIsSlugAvailable(data.available);
        setSlugReason(data.reason || null);
      } catch (err) {
        console.error('Error checking slug availability:', err);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [slug, user?.slug]);

  // Fetch initial profile & Google Calendar connection status
  useEffect(() => {
    fetch('/api/calendar/status', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.connected === 'boolean') {
          setIsConnected(data.connected);
          if (data.calendarId) setCalendarId(data.calendarId);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSlugAvailable) return;

    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          businessName,
          slug,
          bio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil');
      }

      setProfileMessage({ type: 'success', text: '¡Perfil y URL pública actualizados exitosamente!' });
      if (refetchUser) await refetchUser();
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'No se pudo guardar el perfil' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveWhatsappSettings = async () => {
    setIsSavingWhatsappSettings(true);
    setWhatsappSaveMessage(null);

    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          botEnabled: whatsappBotEnabled,
          tone: whatsappTone,
          customPrompt: whatsappCustomPrompt,
          fewShotExamples: whatsappFewShotExamples,
          reminderHours: whatsappReminderHours,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error guardando ajustes de WhatsApp');

      setWhatsappSaveMessage({ type: 'success', text: '¡Ajustes y entrenamiento del bot guardados con éxito!' });
    } catch (err: any) {
      setWhatsappSaveMessage({ type: 'error', text: err.message || 'No se pudo guardar la configuración' });
    } finally {
      setIsSavingWhatsappSettings(false);
    }
  };

  // Polling for WhatsApp connection status when QR modal is open
  useEffect(() => {
    let interval: any;
    if (isWhatsappQrOpen && !isWhatsappConnected) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/whatsapp/status', { headers: getAuthHeaders() });
          const data = await res.json();
          if (data?.qrCode) {
            setWhatsappQrCode(data.qrCode);
          }
          if (data?.connected) {
            setIsWhatsappConnected(true);
            setIsWhatsappQrOpen(false);
            setWhatsappQrCode(null);
          }
        } catch (e) {}
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWhatsappQrOpen, isWhatsappConnected]);

  const handleConnectWhatsapp = async () => {
    setIsConnectingWhatsapp(true);
    setWhatsappQrCode(null);
    setIsWhatsappQrOpen(true);

    try {
      const res = await fetch('/api/whatsapp/connect', { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data?.qrCode) {
        setWhatsappQrCode(data.qrCode);
      }
      if (data?.connected) {
        setIsWhatsappConnected(true);
        setIsWhatsappQrOpen(false);
      }
    } catch (err) {
      console.error('Error conectando WhatsApp:', err);
    } finally {
      setIsConnectingWhatsapp(false);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (!confirm('¿Seguro que deseas desconectar WhatsApp?')) return;
    try {
      await fetch('/api/whatsapp/disconnect', { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      setIsWhatsappConnected(false);
      setIsWhatsappQrOpen(false);
    } catch (err) {
      console.error('Error desconectando WhatsApp:', err);
    }
  };

  const handleSendSimulatedMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim() || isSimLoading) return;

    const userText = simMessage.trim();
    setSimMessage('');
    setSimHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setIsSimLoading(true);

    try {
      const res = await fetch('/api/whatsapp/test-chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      setSimHistory((prev) => [...prev, { role: 'bot', text: data.reply || '¡Hola! Para reservar tu cita entra a tu enlace de agendamiento.' }]);
    } catch (err) {
      setSimHistory((prev) => [...prev, { role: 'bot', text: `¡Hola! Con gusto te ayudo a agendar. Puedes revisar los cupos libres en: espejosstudio.cl/${slug || user?.slug || 'estudio-demo'}` }]);
    } finally {
      setIsSimLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    setIsLoading(true);
    window.location.href = '/api/calendar/connect';
  };

  const handleDisconnectGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/calendar/disconnect', { method: 'POST' });
      if (res.ok) {
        setIsConnected(false);
        setApiKey('');
      }
    } catch (e) {
      console.error('Error desconectando Google Calendar:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !calendarId.trim()) return;

    setIsConnectingApiKey(true);
    setApiKeyMessage(null);

    try {
      const res = await fetch('/api/calendar/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, calendarId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al validar Clave de API de Google');
      }

      setIsConnected(true);
      setApiKeyMessage({ type: 'success', text: '¡Google Calendar sincronizado exitosamente mediante Clave API!' });
    } catch (err: any) {
      setApiKeyMessage({ type: 'error', text: err.message || 'No se pudo verificar la Clave API de Google' });
    } finally {
      setIsConnectingApiKey(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR') return;
    setIsDeletingAccount(true);

    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'ELIMINAR' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar la cuenta');
      }

      window.location.href = '/login';
    } catch (err: any) {
      alert(err.message || 'Ocurrió un error al intentar eliminar la cuenta');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Ajustes & Integraciones</h2>
        <p className="text-slate-400 text-sm mt-1">
          Configura tu identidad de marca, bot de WhatsApp, recordatorios y sincronización de calendario.
        </p>
      </div>

      {/* 1. Public Profile & Brand Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white">Identidad de Marca & Enlace Público</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Personaliza el nombre de tu estudio y el enlace que compartirás con tus clientes.
          </p>
        </div>

        {profileMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
              profileMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {profileMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Comercial del Estudio</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej: Palumbo Providencia, Bernal Barber"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dirección URL de Reserva (`espejosstudio.cl/{'{slug}'}`)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs font-mono">
                espejosstudio.cl/
              </div>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="bernal-barber"
                className="w-full pl-36 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isCheckingSlug ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : isSlugAvailable ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
              </div>
            </div>
            {slugReason && <p className="text-[11px] text-rose-400 mt-1">{slugReason}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Biografía o Eslogan del Estudio</label>
              <span className="text-[11px] text-slate-500">Sugerencias rápidas:</span>
            </div>

            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe la experiencia de tu estudio o tu propuesta de valor para los clientes..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
            />

            <div className="flex flex-wrap gap-2 mt-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBio(preset)}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors text-left"
                >
                  💡 "{preset.slice(0, 42)}..."
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile || isCheckingSlug || !isSlugAvailable}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
          >
            {isSavingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios de Perfil</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. WhatsApp Intelligent Bot & QR Connection Section */}
      <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-xl shadow-emerald-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-[1px] flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-bold text-white">Bot Inteligente de WhatsApp & Recordatorios</h3>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                    isWhatsappConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isWhatsappConnected ? '🟢 Conectado' : '⚪ Desconectado'}
                </span>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                Usa tu mismo número de teléfono escaneando un código QR. El bot responde con lenguaje natural, agenda citas y envía recordatorios automáticos con código de colores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isWhatsappConnected ? (
              <button
                onClick={handleDisconnectWhatsapp}
                className="px-4 py-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={handleConnectWhatsapp}
                disabled={isConnectingWhatsapp}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-2"
              >
                {isConnectingWhatsapp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Vincular con Código QR</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {whatsappSaveMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
              whatsappSaveMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{whatsappSaveMessage.text}</span>
          </div>
        )}

        {/* Bot Customization Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Personality & Prompt */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tono de Conversación de la IA:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cercano', label: '⚡ Cercano & Juvenil', desc: 'Relajado, buena onda' },
                  { id: 'profesional', label: '👔 Profesional', desc: 'Formal y educado' },
                  { id: 'directo', label: '🎯 Directo', desc: 'Breve y al grano' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWhatsappTone(item.id as any)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      whatsappTone === item.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Anticipación del Recordatorio Automático:
              </label>
              <select
                value={whatsappReminderHours}
                onChange={(e) => setWhatsappReminderHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>1 hora antes de la cita</option>
                <option value={2}>2 horas antes de la cita (Recomendado)</option>
                <option value={3}>3 horas antes de la cita</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Entrenamiento con Chats Reales (Few-Shot):
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Personalización</span>
              </div>
              <textarea
                rows={5}
                value={whatsappFewShotExamples}
                onChange={(e) => setWhatsappFewShotExamples(e.target.value)}
                placeholder={`Pega aquí ejemplos de cómo sueles chatear:\n\nCliente: ¿Tienes hora para hoy?\nTú: ¡Hola bro! Sí, me queda un huequito a las 17:30 y a las 19:00. ¿Cuál te acomoda?`}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveWhatsappSettings}
              disabled={isSavingWhatsappSettings}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {isSavingWhatsappSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Guardar Configuración del Bot</span>
            </button>
          </div>

          {/* Right Column: Live Chat Simulator */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Simulador de Chat en Vivo</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                  Gemini 2.0 Flash
                </span>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {simHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isSimLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl text-xs text-slate-400 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-200"></span>
                      <span className="ml-1 text-[10px]">Escribiendo respuesta...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendSimulatedMessage} className="mt-3 flex items-center space-x-2">
              <input
                type="text"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder="Escribe un mensaje de prueba..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSimLoading || !simMessage.trim()}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* WhatsApp QR Modal */}
      {isWhatsappQrOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Vincular WhatsApp</span>
              </div>
              <button onClick={() => setIsWhatsappQrOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mx-auto">
              {whatsappQrCode ? (
                <img 
                  src={whatsappQrCode} 
                  alt="Código QR WhatsApp Web" 
                  className="w-56 h-56 object-contain mx-auto rounded-xl"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 flex flex-col items-center justify-center text-center p-4 rounded-xl">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                  <span className="text-xs text-slate-800 font-bold">Generando Código QR Seguro...</span>
                  <span className="text-[10px] text-slate-500 mt-1">Conectando sesión con WhatsApp</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 space-y-1 text-left bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <p className="font-semibold text-white">Pasos en tu teléfono:</p>
              <p>1. Abre WhatsApp en tu celular.</p>
              <p>2. Ve a <strong>Ajustes &gt; Dispositivos vinculados</strong>.</p>
              <p>3. Toca en <strong>Vincular un dispositivo</strong> y apunta tu cámara a este código QR.</p>
            </div>

            <button
              onClick={() => setIsWhatsappQrOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 3. Google Calendar Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-500 p-[1px] flex-shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-bold text-white">Sincronización con Google Calendar</h3>
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

              <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                Bloquea automáticamente los horarios ocupados en tu Google Calendar personal o de trabajo para evitar sobre-agendamientos en tu espacio.
              </p>
            </div>
          </div>

          {isConnected && (
            <button
              onClick={handleDisconnectGoogle}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Desconectar
            </button>
          )}
        </div>

        {/* Mode Selector Tabs */}
        {!isConnected && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setConnectionMode('apikey')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  connectionMode === 'apikey'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clave API de Google (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setConnectionMode('oauth')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  connectionMode === 'oauth'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cuenta Google OAuth (Pop-up)
              </button>
            </div>

            {/* Mode A: API Key Form */}
            {connectionMode === 'apikey' && (
              <form onSubmit={handleSaveApiKey} className="space-y-4 max-w-xl">
                {apiKeyMessage && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                      apiKeyMessage.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {apiKeyMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{apiKeyMessage.text}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">ID del Calendario (Calendar ID)</label>
                    <button
                      type="button"
                      onClick={() => setIsGuideOpen(true)}
                      className="text-xs text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>¿Cómo obtenerlo? (Guía paso a paso)</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    placeholder="ej: tu-email@gmail.com o id@group.calendar.google.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Clave de API de Google (API Key)</label>
                  <input
                    type="password"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={isConnectingApiKey}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2"
                  >
                    {isConnectingApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Guardar y Validar Conexión</span>
                  </button>
                </div>
              </form>
            )}

            {/* Mode B: OAuth 2.0 Popup */}
            {connectionMode === 'oauth' && (
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3 max-w-xl">
                <p className="text-slate-300 text-xs leading-relaxed">
                  Haz clic a continuación para autorizar la conexión directa mediante el pop-up oficial de inicio de sesión de Google.
                </p>
                <button
                  onClick={handleConnectGoogle}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Iniciar sesión con Google OAuth</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step-by-Step Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 text-left max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cómo obtener tu API Key e ID de Google</h3>
                  <p className="text-slate-400 text-xs">Guía en 3 pasos sencillos</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuideOpen(false)}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Abre Google Cloud Console</h4>
                  <p className="text-slate-400">
                    Entra a <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">console.cloud.google.com</a> e inicia sesión con tu cuenta.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Activa "Google Calendar API"</h4>
                  <p className="text-slate-400">
                    En <strong>APIs y servicios &gt; Biblioteca</strong>, busca <strong>"Google Calendar API"</strong> y pulsa <strong>Habilitar</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Crea la Clave de API</h4>
                  <p className="text-slate-400">
                    Ve a <strong>Credenciales &gt; Crear credenciales &gt; Clave de API</strong> y pégala en el campo superior.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsGuideOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Entendido, Cerrar Guía
            </button>
          </div>
        </div>
      )}

      {/* 4. Danger Zone: Account Deletion */}
      <div className="border border-rose-500/20 bg-rose-500/5 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Zona de Peligro: Eliminar Cuenta</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Al eliminar tu cuenta, se borrarán de forma irreversible todos tus servicios, citas, historial de clientes y tu página pública.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl transition-colors"
        >
          Dar de baja mi cuenta
        </button>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">¿Dar de baja tu cuenta?</h3>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Esta acción eliminará de forma permanente tu espacio <strong className="text-white">espejosstudio.cl/{user?.slug}</strong>, tus servicios, tu CRM de clientes y todo tu historial de citas.
            </p>

            <div className="mb-4 text-left">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Escribe <span className="text-rose-400 font-mono font-bold">ELIMINAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-white font-mono text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR' || isDeletingAccount}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-1.5"
              >
                {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmar Baja</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
