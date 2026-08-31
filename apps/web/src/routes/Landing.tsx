import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Users, ShieldCheck, ArrowRight, CheckCircle2, Zap, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Effects */}
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
              Studio
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
          <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-white transition-colors">Planes</a>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <Link
              to={`/${user.slug}`}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              Ir a mi Espacio ({user.slug})
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-2"
              >
                <span>Crear mi página gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-md shadow-inner">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Diseñado para barberos, estilistas, manicuristas y profesionales de la estética</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
          Refleja tu mejor versión y simplifica tus <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">reservas online</span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Tu propia página web personalizada con agenda en tiempo real, ficha inteligente de clientes y reservas sin contraseñas con Face ID / Huella.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            to="/registro"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-3 group"
          >
            <span>Crear mi espacio `espejosstudio.cl/tu-nombre`</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Live Preview Card Mockup */}
        <div className="relative max-w-4xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-2 mb-4 px-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <div className="ml-4 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-400 font-mono flex items-center space-x-2">
              <span className="text-emerald-400">https://</span>
              <span>espejosstudio.cl/estudio-demo</span>
            </div>
          </div>
          <div className="bg-slate-950 rounded-2xl p-6 md:p-8 text-left border border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold rounded-full mb-3">
                Vista Previa del Cliente
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Estudio Demo Palumbo</h3>
              <p className="text-slate-400 text-sm mb-6">Barbería & Estética Masculina • Providencia, Santiago</p>

              <div className="space-y-3 mb-6">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">Corte de Cabello Signature</h4>
                    <p className="text-xs text-slate-400">35 min • $15.000</p>
                  </div>
                  <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg">Reservar</button>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">Arreglo & Ritual de Barba</h4>
                    <p className="text-xs text-slate-400">25 min • $10.000</p>
                  </div>
                  <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg">Reservar</button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-3 text-emerald-400 text-sm font-semibold">
                <ShieldCheck className="w-5 h-5" />
                <span>Reconocimiento Passkey / Face ID</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tus clientes habituales no necesitan crear contraseñas. Confirman su hora en 1 segundo con la huella digital o rostro de su teléfono.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Integración instantánea con Google Calendar</span>
                <span className="text-indigo-400 font-semibold">100% Sincronizado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="caracteristicas" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white mb-4">Todo lo que necesitas para hacer crecer tu cartera</h2>
          <p className="text-slate-400">Diseñado desde la experiencia real en salones para ahorrar tiempo y fidelizar a cada cliente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Reserva Wizard Mobile-First</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Un flujo paso a paso pensado para el teléfono del cliente. Cero distracciones, selección visual de servicios y disponibilidad real.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Ficha Técnica de Cliente</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Registra preferencias (aromas, alergias, número de corte habitual), historial de gasto y visitas totales. Nunca olvides un detalle.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Galería Espejos con Reflejo</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Muestra tus mejores trabajos en tu perfil. Auto-publicación inteligente desde carpeta dedicada para profesionales Pro.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="relative z-10 max-w-5xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white mb-4">Planes diseñados para cada etapa</h2>
          <p className="text-slate-400">Comienza gratis hoy mismo y escala cuando tu cartera aumente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Free */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Inicial</span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-4">Free</h3>
              <div className="text-4xl font-extrabold text-white mb-6">$0 <span className="text-sm font-normal text-slate-400">/ siempre</span></div>

              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Hasta 50 clientes en base de datos</span></li>
                <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Hasta 5 servicios publicados</span></li>
                <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Página de reserva `espejosstudio.cl/{'{slug}'}`</span></li>
                <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Galería con límite de 10 fotos</span></li>
              </ul>
            </div>

            <Link
              to="/registro"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-center font-semibold rounded-xl transition-colors"
            >
              Comenzar Gratis
            </Link>
          </div>

          {/* Plan Pro */}
          <div className="bg-gradient-to-b from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-indigo-950/50">
            <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wide">
              Espejos Studio
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Plan Profesional</span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-4">Pro</h3>
              <div className="text-4xl font-extrabold text-white mb-6">$9.900 <span className="text-sm font-normal text-slate-400">CLP / mes</span></div>

              <ul className="space-y-3 text-sm text-slate-200 mb-8">
                <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /><span>Clientes y servicios **ilimitados**</span></li>
                <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /><span>Sincronización completa con Google Calendar</span></li>
                <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /><span>Ficha técnica inteligente con tags personalizadas</span></li>
                <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /><span>Galería ilimitada con auto-publicación</span></li>
              </ul>
            </div>

            <Link
              to="/registro"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-center font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
            >
              Probar Plan Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-400">Espejos Studio &copy; {new Date().getFullYear()}</span>
        </div>
        <p>Refleja tu mejor versión. CRM de agendamiento y fidelización.</p>
      </footer>
    </div>
  );
}
