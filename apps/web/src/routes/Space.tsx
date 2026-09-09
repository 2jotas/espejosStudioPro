import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Check,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ServiceItem } from '../components/admin/ServicesManager';
import BookingWizard from '../components/booking/BookingWizard';

export default function Space() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  // Visitor View State
  const [profInfo, setProfInfo] = useState<{ 
    businessName: string; 
    bio?: string; 
    phone?: string; 
    address?: string;
    avatarUrl?: string;
  } | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Default services fallback for John / Antofagasta
  const defaultServicesList: ServiceItem[] = [
    { id: '1', name: 'Corte clásico / tijera', description: 'Corte tradicional a tijera o máquina, lavado y peinado.', durationMinutes: 45, price: 15000, active: true, order: 1 },
    { id: '2', name: 'Fade', description: 'Degradado limpio (Skin fade, Mid, Low o High fade) con terminación a navaja.', durationMinutes: 45, price: 15000, active: true, order: 2 },
    { id: '3', name: 'Corte + Barba', description: 'Servicio completo de corte personalizado y perfilado de barba con toalla tibia.', durationMinutes: 60, price: 22000, active: true, order: 3 },
    { id: '4', name: 'Barba / Perfilado', description: 'Perfilado de contornos, rebaje y toalla tibia con aceite hidratante.', durationMinutes: 30, price: 10000, active: true, order: 4 },
    { id: '5', name: 'Corte Niño', description: 'Corte paciente y detallado para niños de hasta 12 años.', durationMinutes: 30, price: 12000, active: true, order: 5 },
  ];

  useEffect(() => {
    if (!slug) return;
    const fetchPublicData = async () => {
      try {
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
          if (data.services && data.services.length > 0) {
            setServices(data.services);
          } else {
            setServices(defaultServicesList);
          }
        } else {
          setServices(defaultServicesList);
        }
      } catch (e) {
        setServices(defaultServicesList);
      }
    };

    fetchPublicData();
  }, [slug]);

  // =========================================================================
  // VISTA PÚBLICA DEL CLIENTE (ESPEJOS STUDIO · ANTOFAGASTA / JOHN)
  // =========================================================================
  const displayName = profInfo?.businessName || (slug === 'john' ? 'John' : (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Espejos Studio'));
  const bioText = profInfo?.bio || 'Cortes clásico, fade y barba. Preciso, tranquilo, a tiempo. Pide hora aquí.';
  const businessPhone = profInfo?.phone || '+56912345678';
  const isOwner = Boolean(user && user.slug === slug);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Banner flotante discreto si el dueño está conectado */}
      {isOwner && (
        <div className="bg-indigo-950/90 border-b border-indigo-500/30 text-indigo-200 text-xs py-2 px-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Página pública de cliente</span>
          </div>
          <Link
            to="/panel"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <LayoutDashboard className="w-3 h-3" />
            <span>Abrir Panel CRM</span>
          </Link>
        </div>
      )}

      {/* Glow Superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-80 bg-gradient-to-b from-indigo-600/15 via-purple-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Minimalista */}
      <header className="relative z-10 max-w-lg mx-auto w-full flex items-center justify-between p-4 pt-5">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Espejos Studio</span>
        </div>

        {user ? (
          <Link to="/panel" className="text-[11px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full transition-colors">
            {user.slug} • Panel
          </Link>
        ) : (
          <Link to="/login" className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300">
            Acceso Profesional
          </Link>
        )}
      </header>

      {/* Above the Fold — Perfil & Agendamiento Móvil */}
      <main className="relative z-10 max-w-lg mx-auto w-full px-4 py-6 text-center space-y-6 flex-1 flex flex-col justify-center">

        {/* Foto de Perfil de John */}
        <div className="relative inline-block mx-auto">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] shadow-2xl shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[22px] overflow-hidden flex items-center justify-center">
              {profInfo?.avatarUrl ? (
                <img 
                  src={profInfo.avatarUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center font-extrabold text-white text-3xl">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-full ring-4 ring-slate-950">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* Nombre & Ubicación */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{displayName}</h1>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            <MapPin className="w-3.5 h-3.5" />
            <span>Espejos Studio · Antofagasta</span>
          </div>
        </div>

        {/* Bio Fija (máx 160 caracteres) */}
        <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed font-normal">
          {bioText}
        </p>

        {/* Horario Real */}
        <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Lunes a Sábado: 10:00 a 20:00 hrs</span>
        </div>

        {/* CTA Principal Único */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setIsBookingOpen(true)}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2"
          >
            <Calendar className="w-5 h-5" />
            <span>Agendar Hora con John</span>
          </button>

          {/* WhatsApp Directo */}
          <a
            href={`https://wa.me/${businessPhone.replace(/\D/g, '')}?text=Hola%20John,%20te%20escribo%20desde%20tu%20sitio%20web`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>

        {/* Lista de Servicios v1 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 text-left space-y-3 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Servicios & Precios
            </span>
            <span className="text-[11px] text-indigo-400 font-medium">Antofagasta</span>
          </div>

          <div className="space-y-2.5">
            {services.map((s) => (
              <div
                key={s.id}
                className="p-3.5 bg-slate-950/80 border border-slate-800/60 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{s.name}</h4>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                    <span>{s.durationMinutes} min</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-200">${s.price.toLocaleString('es-CL')} CLP</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-xs rounded-xl transition-all"
                >
                  Elegir
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-lg mx-auto w-full text-center py-4 text-[11px] text-slate-600 border-t border-slate-900">
        Espejos Studio · Antofagasta · Todos los derechos reservados.
      </footer>

      {/* Wizard en 4 Pasos Overlay */}
      {isBookingOpen && (
        <BookingWizard
          slug={slug || 'john'}
          businessName={displayName}
          address={profInfo?.address}
          phone={profInfo?.phone}
          services={services}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </div>
  );
}
