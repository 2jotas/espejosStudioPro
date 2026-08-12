import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, LayoutDashboard, Calendar, Users, Scissors, Image as ImageIcon, Settings, LogOut, ExternalLink, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ServicesManager from '../components/admin/ServicesManager';
import ClientsManager from '../components/admin/ClientsManager';
import SettingsIntegrations from '../components/admin/SettingsIntegrations';

type AdminTab = 'dashboard' | 'calendar' | 'clients' | 'services' | 'gallery' | 'settings';

export default function Space() {
  const { slug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('services');

  const isOwner = user && user.slug === slug;

  if (isOwner) {
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
                <span className="text-[11px] text-slate-400 font-mono">espejos.cl/{user.slug}</span>
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
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Plan Actual</span>
                <span className="text-xs font-bold text-indigo-400 uppercase">{user.plan}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded-full border border-emerald-500/20">
                Activo
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
          {activeTab === 'services' && <ServicesManager />}
          {activeTab === 'clients' && <ClientsManager />}
          {activeTab === 'settings' && <SettingsIntegrations />}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <span className="text-slate-400 text-xs font-semibold uppercase">Citas de hoy</span>
                  <div className="text-3xl font-extrabold text-white mt-2">0</div>
                  <span className="text-xs text-slate-500 mt-1 block">Próximas reservas</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <span className="text-slate-400 text-xs font-semibold uppercase">Clientes Activos</span>
                  <div className="text-3xl font-extrabold text-white mt-2">5</div>
                  <span className="text-xs text-slate-500 mt-1 block">En base de datos CRM</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <span className="text-slate-400 text-xs font-semibold uppercase">Servicios Activos</span>
                  <div className="text-3xl font-extrabold text-white mt-2">3</div>
                  <span className="text-xs text-slate-500 mt-1 block">Disponibles para reserva</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-lg font-bold text-white mb-2">Bienvenido a tu panel de administración</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Usa el menú lateral para gestionar tus servicios, clientes e integraciones.
                </p>
              </div>
            </div>
          )}

          {activeTab !== 'services' && activeTab !== 'dashboard' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Módulo {activeTab}</h3>
              <p className="text-sm">Este módulo será activado en las siguientes fases del desarrollo.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Visitor View (Client / Guest)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between">
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

      <main className="relative z-10 max-w-2xl mx-auto w-full my-auto text-center py-16">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] mb-6 shadow-xl shadow-indigo-500/25">
          <div className="h-full w-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Scissors className="w-9 h-9 text-indigo-400" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3">Espacio `{slug}`</h1>
        <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-lg mx-auto">
          Reserva tu hora online de forma rápida y sin complicaciones en <span className="text-indigo-400 font-mono">espejos.cl/{slug}</span>.
        </p>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl mb-8 text-left shadow-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-4">Servicios Disponibles</span>
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white">Corte de Cabello Signature</h4>
                <p className="text-xs text-slate-400">35 min • $15.000 CLP</p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs rounded-xl shadow-md">
                Reservar
              </button>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white">Arreglo & Ritual de Barba</h4>
                <p className="text-xs text-slate-400">25 min • $10.000 CLP</p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs rounded-xl shadow-md">
                Reservar
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 max-w-4xl mx-auto w-full text-center text-xs text-slate-500">
        Reserva tu hora en {slug} a través de Espejos Studio.
      </footer>
    </div>
  );
}
