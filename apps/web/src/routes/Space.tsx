import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, LayoutDashboard, Calendar, Users, Scissors, Image as ImageIcon, Settings, LogOut, ExternalLink, ShieldCheck, UserCheck, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ServicesManager, { ServiceItem } from '../components/admin/ServicesManager';
import ClientsManager from '../components/admin/ClientsManager';
import SettingsIntegrations from '../components/admin/SettingsIntegrations';
import GalleryManager from '../components/admin/GalleryManager';
import PricingUpgrade from '../components/admin/PricingUpgrade';
import CalendarManager from '../components/admin/CalendarManager';
import DashboardTab from '../components/DashboardTab';
import MirrorGallery from '../components/public/MirrorGallery';
import BookingWizard from '../components/booking/BookingWizard';
import VisagismWizardModal from '../components/visagism/VisagismWizardModal';

type AdminTab = 'dashboard' | 'calendar' | 'clients' | 'services' | 'gallery' | 'settings' | 'pricing';

export default function Space() {
  const { slug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Visitor View State
  const [profInfo, setProfInfo] = useState<{ businessName: string; bio?: string; phone?: string; address?: string } | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoadingPublicServices, setIsLoadingPublicServices] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isVisagismOpen, setIsVisagismOpen] = useState(false);

  const isPreviewMode = new URLSearchParams(window.location.search).get('preview') === 'true';
  const isOwner = Boolean(user && user.slug === slug && !isPreviewMode);

  useEffect(() => {
    if (!slug) return;
    const fetchPublicData = async () => {
      try {
        setIsLoadingPublicServices(true);

        const [infoRes, servicesRes] = await Promise.all([
          fetch(`/api/professionals/${slug}/info`),
          fetch(`/api/professionals/${slug}/services`),
        ]);

        if (infoRes.ok) {
          const data = await infoRes.json();
          setProfInfo(data.professional);
        }

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data.services);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingPublicServices(false);
      }
    };

    fetchPublicData();
  }, [slug]);

  if (isOwner && user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
                <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm truncate">{user.businessName}</h2>
                <span className="text-[11px] text-slate-400 font-mono">espejosstudio.cl/{user.slug}</span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'calendar'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendario</span>
              </button>

              <button
                onClick={() => setActiveTab('clients')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'clients'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Clientes (CRM)</span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'services'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>Servicios</span>
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'gallery'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Galería Espejos</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </button>
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-6">
            <div
              onClick={() => setActiveTab('pricing')}
              className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Plan Actual</span>
                <span className="text-xs font-bold text-indigo-400 uppercase">{user.plan}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded-full border border-emerald-500/20">
                Ver Planes
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 text-sm font-semibold rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Admin Area */}
        <main className="flex-1 p-6 md:p-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Modo Administración (Dueño del espacio)</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Panel de {user.businessName}</h1>
            </div>

            <a
              href={`/${slug}?preview=true`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm font-semibold rounded-xl flex items-center space-x-2 w-fit transition-colors"
            >
              <span>Ver mi página pública</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </header>

          {/* Dynamic Content by Active Tab */}
          {activeTab === 'dashboard' && <DashboardTab professionalSlug={user.slug} />}
          {activeTab === 'calendar' && <CalendarManager />}
          {activeTab === 'services' && <ServicesManager />}
          {activeTab === 'clients' && <ClientsManager />}
          {activeTab === 'settings' && <SettingsIntegrations />}
          {activeTab === 'gallery' && <GalleryManager />}
          {activeTab === 'pricing' && <PricingUpgrade />}


        </main>
      </div>
    );
  }

  // Visitor View (Client / Guest Landing for Professional)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Preview Mode Top Banner for Space Owner */}
      {user && user.slug === slug && isPreviewMode && (
        <div className="bg-indigo-600/90 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center space-x-3 backdrop-blur-md sticky top-0 z-50 shadow-lg">
          <Eye className="w-4 h-4 flex-shrink-0" />
          <span>Vista Previa: Así es como tus clientes ven tu página de reserva pública</span>
          <Link
            to={`/${slug}`}
            className="bg-slate-950 text-indigo-300 hover:text-white px-3 py-1 rounded-lg text-[11px] font-semibold border border-indigo-400/30 transition-colors"
          >
            Volver a mi Panel
          </Link>
        </div>
      )}

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between p-6 md:px-0 pt-6">
        <Link to="/" className="flex items-center space-x-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Espejos</span>
        </Link>
        {user ? (
          <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Navegando como {user.slug}</span>
          </span>
        ) : (
          <Link to="/login" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            ¿Eres el dueño? Iniciar sesión
          </Link>
        )}
      </header>

      <main className="relative z-10 max-w-2xl mx-auto w-full my-auto text-center py-12">
        {/* Top Branding Pill */}
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Refleja Tu Mejor Versión</span>
        </div>

        {/* Business Name Header */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
          {profInfo?.businessName || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Estudio')}
        </h1>

        {/* Professional Slogan / Bio */}
        <p className="text-slate-300 text-sm sm:text-base mb-6 max-w-xl mx-auto leading-relaxed font-normal">
          {profInfo?.bio || 'Especialistas en cortes a la medida, visagismo y cuidado personal. Reserva tu hora online y refleja tu mejor versión.'}
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs font-medium text-slate-400">
          <span className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Agendamiento 1-Tap Passkeys</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Confirmación Instantánea</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setIsBookingOpen(true)}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-500/25 transition-all"
          >
            Reservar Hora Ahora
          </button>

          <button
            onClick={() => setIsVisagismOpen(true)}
            className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Asesoría de Visagismo IA</span>
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl mb-8 text-left shadow-2xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
            Servicios Disponibles
          </span>

          {isLoadingPublicServices ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-950/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <p className="text-slate-500 text-xs">No hay servicios publicados actualmente.</p>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{s.name}</h4>
                    <p className="text-xs text-slate-400">
                      {s.durationMinutes} min • ${s.price.toLocaleString('es-CL')} CLP
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBookingOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                  >
                    Reservar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Public Mirror Reflection Gallery */}
        <MirrorGallery slug={slug!} />
      </main>

      <footer className="relative z-10 max-w-4xl mx-auto w-full text-center text-xs text-slate-500">
        Reserva tu hora en {slug} a través de Espejos Studio.
      </footer>

      {/* Booking Wizard Modal Overlay */}
      {isBookingOpen && (
        <BookingWizard
          slug={slug!}
          businessName={slug!}
          services={services}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

      {/* Visagism Wizard Modal Overlay */}
      {isVisagismOpen && (
        <VisagismWizardModal
          onClose={() => setIsVisagismOpen(false)}
          onSelectHaircutForBooking={() => {
            setIsVisagismOpen(false);
            setIsBookingOpen(true);
          }}
        />
      )}
    </div>
  );
}
