import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ExternalLink, RefreshCw, MessageSquare, Store, Check, AlertTriangle, Trash2, ShieldAlert, Loader2, HelpCircle, Key, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SettingsIntegrations() {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();

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

  // Debounced Slug Availability Checker
  useEffect(() => {
    if (!slug || slug.trim().toLowerCase() === user?.slug) {
      setIsSlugAvailable(true);
      setSlugReason(null);
      return;
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setIsSlugAvailable(false);
      setSlugReason('El slug solo puede contener letras minúsculas, números y guiones.');
      return;
    }

    setIsCheckingSlug(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-slug/${encodeURIComponent(cleanSlug)}`);
        const data = await res.json();
        setIsSlugAvailable(data.available);
        setSlugReason(data.reason || null);
      } catch (e) {
        setIsSlugAvailable(false);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, user?.slug]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          slug: slug.trim().toLowerCase(),
          bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar el perfil');

      await refetchUser();
      setProfileMessage({ type: 'success', text: 'Perfil y presentación de tu espacio actualizados correctamente.' });

      if (data.slugChanged) {
        // Redirect to new slug URL
        setTimeout(() => {
          navigate(`/${data.user.slug}`);
        }, 1000);
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

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

  const handleConnectApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarId || !apiKey) {
      setApiKeyMessage({ type: 'error', text: 'Ingresa el Nombre/ID del calendario y tu Clave API' });
      return;
    }

    try {
      setIsConnectingApiKey(true);
      setApiKeyMessage(null);
      const res = await fetch('/api/calendar/connect-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId, apiKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error de verificación de Google Calendar');
      }

      setIsConnected(true);
      setApiKeyMessage({ type: 'success', text: data.message });
      await refetchUser();
    } catch (err: any) {
      setApiKeyMessage({ type: 'error', text: err.message });
    } finally {
      setIsConnectingApiKey(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/calendar/auth-url');
      if (!res.ok) throw new Error('Error al obtener la URL de autenticación');
      const data = await res.json();

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

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la cuenta');

      alert('Tu cuenta ha sido dada de baja exitosamente.');
      window.location.href = '/';
    } catch (err: any) {
      alert(err.message);
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white">Configuración del Espacio</h2>
        <p className="text-slate-400 text-sm">Personaliza el nombre de tu negocio, tu enlace de reserva e integraciones</p>
      </div>

      {/* Profile & Slug Settings Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Información del Espacio</h3>
            <p className="text-slate-400 text-xs">Cambia el nombre de tu negocio y la dirección URL pública</p>
          </div>
        </div>

        {profileMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center space-x-2 ${
              profileMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {profileMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de tu Espacio / Negocio</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej: Bernal Master Barbershop"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Slogan / Mensaje de Presentación del Espacio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Especialistas en cortes a la medida, visagismo y cuidado personal. Refleja tu mejor versión."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
            />
            <div className="mt-2 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Sugerencias profesionales (Haz clic para usar):</span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBio(preset)}
                    className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors text-left"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>
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

            {slugReason && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{slugReason}</p>
            )}

            <p className="text-[11px] text-slate-500 mt-1">
              Esta es la URL que compartirás a tus clientes para agendar citas.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile || isSlugAvailable === false}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSavingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Integrations List Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Integraciones Externas</h3>

        {/* Google Calendar Card */}
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

          {/* Connection Mode Selector Tabs */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setConnectionMode('apikey')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
                  connectionMode === 'apikey'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Por Clave API & ID Calendario (Directo)</span>
              </button>
              <button
                type="button"
                onClick={() => setConnectionMode('oauth')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
                  connectionMode === 'oauth'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Por OAuth 2.0 (Google Login)</span>
              </button>
            </div>

            {/* Mode A: Direct API Key & Calendar ID Form */}
            {connectionMode === 'apikey' && (
              <form onSubmit={handleConnectApiKey} className="space-y-4 max-w-xl bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                {apiKeyMessage && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
                      apiKeyMessage.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {apiKeyMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{apiKeyMessage.text}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">ID / Nombre del Calendario de Google</label>
                    <span className="text-[10px] text-slate-500">Ej: tu-correo@gmail.com</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    placeholder="ejemplo@gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Clave API de Google (Google API Key)</label>
                    <button
                      type="button"
                      onClick={() => setIsGuideOpen(true)}
                      className="text-[11px] text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>¿Dónde la obtengo paso a paso?</span>
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    disabled={isConnectingApiKey}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {isConnectingApiKey ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verificando conexión...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Probar & Conectar Calendario</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGuideOpen(true)}
                    className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Guía rápida</span>
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
        </div>

        {/* Step-by-Step Interactive Guide Modal */}
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
                    <p className="text-slate-400 text-xs">Guía en 5 pasos sencillos (Gratuito & 2 minutos)</p>
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
                      Entra a <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">console.cloud.google.com</a> e inicia sesión con tu cuenta de Google.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Activa "Google Calendar API"</h4>
                    <p className="text-slate-400">
                      En el menú lateral ve a <strong>APIs y servicios &gt; Biblioteca</strong>, busca <strong>"Google Calendar API"</strong> y haz clic en el botón <strong>Habilitar</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Crea la Clave API (API Key)</h4>
                    <p className="text-slate-400">
                      Ve a <strong>Credenciales &gt; Crear credenciales &gt; Clave de API</strong>. Copia la clave generada (empieza por <code className="text-indigo-300">AIzaSy...</code>) y pégala arriba.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">4</span>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Obtén el ID de tu Calendario</h4>
                    <p className="text-slate-400">
                      Abre tu <a href="https://calendar.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google Calendar</a>, entra a <strong>Configuración &gt; Integrar el calendario</strong> y copia el <strong>ID del calendario</strong> (normalmente es tu correo de Gmail).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">5</span>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Prueba y Guarda la Conexión</h4>
                    <p className="text-slate-400">
                      Haz clic en <strong>Probar & Conectar Calendario</strong>. El sistema verificará la conexión en vivo y te mostrará el indicador de Sincronizado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md"
                >
                  Entendido, volver al formulario
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Reminders Placeholder */}
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
                Envía confirmaciones y recordatorios automáticos por WhatsApp a tus clientes 24 horas antes de su cita.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone (Account Deletion) */}
      <div className="bg-rose-950/20 border border-rose-500/20 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-3 text-rose-400 font-bold text-sm">
          <ShieldAlert className="w-5 h-5" />
          <span>Zona de Peligro</span>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
          Si deseas suspender o eliminar permanentemente tu cuenta y tu espacio de agendamiento, puedes hacerlo desde aquí.
        </p>

        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 hover:border-rose-600 text-rose-300 hover:text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Dar de baja / Eliminar mi cuenta</span>
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
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR' || isDeletingAccount}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                {isDeletingAccount ? 'Eliminando...' : 'Eliminar Definivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
