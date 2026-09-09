import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  Sparkles, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  Settings, 
  LogOut, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ServicesManager from '../components/admin/ServicesManager';
import ClientsManager from '../components/admin/ClientsManager';
import SettingsIntegrations from '../components/admin/SettingsIntegrations';
import GalleryManager from '../components/admin/GalleryManager';
import PricingUpgrade from '../components/admin/PricingUpgrade';
import CalendarManager from '../components/admin/CalendarManager';
import DashboardTab from '../components/DashboardTab';

type AdminTab = 'dashboard' | 'calendar' | 'clients' | 'services' | 'gallery' | 'settings' | 'pricing';

export default function AdminPanel() {
  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Cargando panel de control...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const publicUrl = `/${user.slug}`;

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
              <span>Calendario & Citas</span>
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
              <span>Fichas de Clientes</span>
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
              <span>Catálogo de Servicios</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-indigo-600 text-white'
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
                  ? 'bg-indigo-600 text-white'
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
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver mi Link Público</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Admin Tab Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
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
