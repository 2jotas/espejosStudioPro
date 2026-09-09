import { Link } from 'react-router-dom';
import { Sparkles, Calendar, ShieldCheck, ArrowRight, Zap, Check, MessageSquare, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[128px]" />
        <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Espejos
            </span>
            <span className="ml-2 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Agenda
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
          <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
          <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-white transition-colors">Planes</a>
          <Link to="/demo" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Ver Demo
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              to={`/${user.slug}`}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              Mi Panel ({user.slug})
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2"
              >
                <span>Crear mi espacio gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Diseñado para barberos, estilistas y profesionales independientes</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
          Tu cliente agenda en tu link. <br />
          Tú ves la ficha. <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Sin comisión al cliente.</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
          Tu propio link personalizado con wizard en 4 pasos por WhatsApp, recordatorios automáticos para reducir inasistencias y Ficha Técnica de corte en 20 segundos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-12">
          <Link
            to="/registro"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2"
          >
            <span>Crear mi espacio gratis</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/john"
            className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm rounded-2xl transition-all"
          >
            Ver espacio en vivo (/john)
          </Link>
        </div>

        {/* Live Preview Card */}
        <div className="relative max-w-3xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-2 mb-4 px-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <div className="ml-4 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-400 font-mono flex items-center space-x-2">
              <span className="text-emerald-400">https://</span>
              <span>espejosstudio.cl/john</span>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl p-5 sm:p-6 text-left border border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full mb-2">
                Página de Reserva del Cliente
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Espejos Studio · Antofagasta</h3>
              <p className="text-slate-400 text-xs mb-4">Cortes clásico, fade y barba. Preciso, a tiempo.</p>

              <div className="space-y-2">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-200">Fade Signature</h4>
                    <p className="text-[11px] text-slate-400">45 min • $15.000 CLP</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-semibold text-[11px]">Elegir</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-200">Corte + Barba</h4>
                    <p className="text-[11px] text-slate-400">60 min • $22.000 CLP</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-semibold text-[11px]">Elegir</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" />
                <span>Wizard en 4 Pasos sin Contraseñas</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tus clientes solo ingresan su WhatsApp y nombre. Sin descargar apps ni recordar contraseñas.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Recordatorios automáticos</span>
                <span className="text-emerald-400 font-semibold">1-2h antes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="caracteristicas" className="relative z-10 max-w-6xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Todo lo que necesitas para llenar tu silla
          </h2>
          <p className="text-slate-400 text-sm">
            Diseñado específicamente para el ritmo de trabajo real de un profesional de la belleza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Link Propio y Agenda Móvil</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comparte tu enlace en Instagram y WhatsApp. Tus clientes eligen el día y la hora disponible según tu horario real.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Ficha Técnica en 20 Segundos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guarda la fórmula de máquinas, tijera, barba y ritmo (14/21/28 días) para recordar el corte exacto de cada cliente.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">WhatsApp & Cero No-Shows</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Envía recordatorios automáticos con un clic y confirma asistencias antes de que el cliente llegue al sillón.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="relative z-10 max-w-5xl mx-auto px-6 py-16 border-t border-slate-900 text-center">
        <div className="max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Planes Claros y Transparentes</h2>
          <p className="text-slate-400 text-sm">Empieza gratis y escala a Pro cuando tu agenda crezca.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
          {/* Plan Free */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Plan Free</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">$0 CLP</h3>
              <p className="text-xs text-slate-400 mt-1">Ideal para profesionales que están comenzando.</p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-indigo-400" />
                <span>Hasta 50 reservas al mes</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-indigo-400" />
                <span>Link personalizado `espejosstudio.cl/tu-nombre`</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-indigo-400" />
                <span>Catálogo de servicios y calendario móvil</span>
              </li>
            </ul>

            <Link
              to="/registro"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center transition-colors"
            >
              Comenzar Gratis
            </Link>
          </div>

          {/* Plan Pro */}
          <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900/90 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Recomendado
            </div>

            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase">Plan Pro</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">$14.990 <span className="text-xs text-slate-400 font-normal">/mes</span></h3>
              <p className="text-xs text-slate-400 mt-1">Para profesionales con agenda activa y alta recurrencia.</p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span><strong>Reservas ilimitadas</strong></span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span><strong>Ficha Técnica v1 completa</strong></span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Recordatorios automáticos de WhatsApp</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Sin marca de agua en tu página pública</span>
              </li>
            </ul>

            <Link
              to="/registro"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all"
            >
              Probar Plan Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>© 2026 Espejos Agenda · Inversiones y Servicios Integrales Ortiz SpA.</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/terminos" className="hover:text-slate-400 transition-colors">Términos</Link>
          <Link to="/privacidad" className="hover:text-slate-400 transition-colors">Privacidad</Link>
          <Link to="/demo" className="hover:text-slate-400 transition-colors">Estudio Demo</Link>
        </div>
      </footer>
    </div>
  );
}
