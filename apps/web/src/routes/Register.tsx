import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, Store, Globe, CheckCircle, XCircle, Loader2, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [slugStatus, setSlugStatus] = useState<{ isChecking: boolean; available: boolean | null; message: string | null }>({
    isChecking: false,
    available: null,
    message: null,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Auto-generate slug from business name if user hasn't typed manually
  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  // Debounced slug availability check
  useEffect(() => {
    if (!slug.trim()) {
      setSlugStatus({ isChecking: false, available: null, message: null });
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus({ isChecking: true, available: null, message: null });
      try {
        const res = await fetch(`/api/auth/check-slug/${encodeURIComponent(slug.trim())}`);
        const data = await res.json();
        if (res.ok && data.available) {
          setSlugStatus({ isChecking: false, available: true, message: 'Dirección disponible' });
        } else {
          setSlugStatus({ isChecking: false, available: false, message: data.reason || 'No disponible' });
        }
      } catch {
        setSlugStatus({ isChecking: false, available: false, message: 'Error verificando slug' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (slugStatus.available === false) {
      setError('Por favor elige un slug o nombre de usuario válido y disponible.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register({ email, password, slug: slug.trim(), businessName, phone });
      navigate(`/${user.slug}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <span className="text-xl font-bold text-white">Espejos</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Crea tu Espacio Profesional</h1>
          <p className="text-sm text-slate-400 mt-1">Obtén tu página web de agendamiento en 1 minuto</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center space-x-3 text-rose-400 text-sm">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Nombre del Negocio o Nombre Profesional
              </label>
              <div className="relative">
                <Store className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  placeholder="Ej: Barbería Palumbo Providencia / Sofía Estética"
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Tu Dirección Web (`espejos.cl/{'{slug}'}`)
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="tu-nombre-estudio"
                  className="w-full pl-12 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm font-mono"
                />
                <div className="absolute right-3 top-3.5">
                  {slugStatus.isChecking && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                  {!slugStatus.isChecking && slugStatus.available === true && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  {!slugStatus.isChecking && slugStatus.available === false && <XCircle className="w-5 h-5 text-rose-400" />}
                </div>
              </div>

              {slug && (
                <div className="mt-2 text-xs flex items-center justify-between">
                  <span className="text-slate-400 font-mono">https://espejos.cl/{slug}</span>
                  {slugStatus.message && (
                    <span className={slugStatus.available ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {slugStatus.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@ejemplo.cl"
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56912345678"
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || slugStatus.available === false}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
            >
              {isSubmitting ? (
                <span>Creando mi espacio...</span>
              ) : (
                <>
                  <span>Crear mi Espacio Gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
