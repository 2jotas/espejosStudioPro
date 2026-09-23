import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  Settings, 
  LogOut, 
  Eye, 
  ExternalLink,
  ArrowLeft,
  Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserSession } from '@espejos/shared-types';
import ServicesManager from '../components/admin/ServicesManager';
import ClientsManager from '../components/admin/ClientsManager';
import SettingsIntegrations from '../components/admin/SettingsIntegrations';
import GalleryManager from '../components/admin/GalleryManager';
import PricingUpgrade from '../components/admin/PricingUpgrade';
import CalendarManager from '../components/admin/CalendarManager';
import DashboardTab from '../components/DashboardTab';

type AdminTab = 'dashboard' | 'calendar' | 'clients' | 'services' | 'gallery' | 'settings' | 'pricing';

interface AdminPanelProps {
  isDemo?: boolean;
}

const DEMO_USER: UserSession = {
  id: 'demo-professional-id',
  email: 'demo@espejosstudio.cl',
  businessName: 'Estudio Demo Palumbo',
  slug: 'demo',
  phone: '+56 9 9876 5432',
  bio: 'Demostración de agenda online para profesionales independientes.',
  address: 'Demostración · Chile',
  plan: 'pro',
};

export default function AdminPanel({ isDemo: propIsDemo }: AdminPanelProps) {
  const location = useLocation();
  const isDemo = propIsDemo || location.pathname === '/demo/panel' || new URLSearchParams(location.search).get('demo') === 'true';

  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  if (isLoading && !isDemo) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Cargando panel de control...
      </div>
    );
  }

  const currentUser = isDemo ? DEMO_USER : user;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const publicUrl = isDemo ? '/demo' : `/${currentUser.slug}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Banner si es Modo Demostración */}
      {isDemo && (
        <div className="bg-amber-950/90 border-b border-amber-500/40 text-amber-200 text-xs py-2 px-4 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Panel CRM (Modo Demostración):</strong> Estás interactuando con las herramientas de gestión de un profesional.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/demo"
              className="bg-amber-900/70 hover:bg-amber-800/80 border border-amber-500/40 text-amber-200 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Ver Espacio Público</span>
            </Link>
            <Link
              to="/registro"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm"
            >
              Crear mi espacio gratis
            </Link>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between">
          <div>
            {/* Header del Sidebar con link a Home */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/80">
              <Link 
                to="/" 
                className="flex items-center space-x-2.5 text-slate-300 hover:text-white transition-colors group" 
                title="Ir a la página de inicio"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
                  <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
                  </div>
                </div>
                <div>
                  <span className="font-extrabold text-white text-xs tracking-wider uppercase block">Espejos</span>
                  <span className="text-[10px] text-indigo-400 font-medium">CRM Profesional</span>
                </div>
              </Link>

              <Link
                to="/"
                className="text-[11px] text-slate-400 hover:text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
                title="Volver a la web pública de inicio"
              >
                <Home className="w-3 h-3" />
                <span>Inicio</span>
              </Link>
            </div>

            {/* Tarjeta de Identidad del Profesional */}
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl mb-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white text-sm truncate">{currentUser.businessName}</h2>
                {isDemo && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    DEMO
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono block truncate mt-0.5">
                espejosstudio.cl/{currentUser.slug}
              </span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
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
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendario & Citas</span>
              </button>

              <button
                onClick={() => setActiveTab('clients')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'clients'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Fichas de Clientes</span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'services'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>Catálogo de Servicios</span>
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'gallery'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Galería Espejos</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configuración & WhatsApp</span>
              </button>
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-800 space-y-2">
            <Link
              to={publicUrl}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isDemo ? 'Ver Espacio Demo' : 'Ver mi Link Público'}</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </Link>

            <Link
              to="/"
              className="w-full flex items-center justify-center space-x-1.5 py-2 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium hover:bg-slate-800/40 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Volver a la Landing</span>
            </Link>

            {!isDemo && (
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </aside>

        {/* Admin Tab Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardTab professionalSlug={currentUser.slug} isDemo={isDemo} />}
          {activeTab === 'calendar' && <CalendarManager isDemo={isDemo} />}
          {activeTab === 'services' && <ServicesManager isDemo={isDemo} />}
          {activeTab === 'clients' && <ClientsManager isDemo={isDemo} />}
          {activeTab === 'settings' && <SettingsIntegrations isDemo={isDemo} />}
          {activeTab === 'gallery' && <GalleryManager isDemo={isDemo} />}
          {activeTab === 'pricing' && <PricingUpgrade />}
        </main>
      </div>
    </div>
  );
}
