import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Zap, ArrowRight, CreditCard, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface PlanUsageData {
  plan: 'free' | 'pro';
  planConfig: {
    name: 'free' | 'pro';
    displayName: string;
    priceClp: number;
    maxServices: number;
    maxClients: number;
    maxGalleryImages: number;
    googleCalendarAllowed: boolean;
    autoWatchFolderAllowed: boolean;
    features: string[];
  };
  usage: {
    servicesCount: number;
    clientsCount: number;
    galleryCount: number;
  };
}

export default function PricingUpgrade() {
  const { user, refetchUser } = useAuth();
  const [data, setData] = useState<PlanUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const fetchUsage = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/plans/usage');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleUpgradePlan = async (targetPlan: 'free' | 'pro') => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/plans/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan }),
      });

      if (!res.ok) throw new Error('Error al actualizar plan');

      await refetchUser();
      await fetchUsage();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-slate-900/40 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const { planConfig, usage } = data;
  const isPro = user?.plan === 'pro';

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Current Plan Usage Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h2 className="text-xl font-bold text-white">Tu Plan Actual: {planConfig.displayName}</h2>
              <span
                className={`px-3 py-1 text-xs font-extrabold uppercase rounded-full border ${
                  isPro
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isPro ? 'Pro Active' : 'Free'}
              </span>
            </div>
            <p className="text-slate-400 text-xs">Revisa los límites de uso de tu cuenta y escala tus funcionalidades</p>
          </div>

          {!isPro && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-2 w-fit"
            >
              <Zap className="w-4 h-4" />
              <span>Actualizar a Plan Pro</span>
            </button>
          )}
        </div>

        {/* Usage Progress Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          {/* Services meter */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Servicios Publicados</span>
              <span className="font-bold text-white">
                {usage.servicesCount} / {isPro ? '∞' : planConfig.maxServices}
              </span>
            </div>
            {!isPro && (
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${usage.servicesCount >= 5 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min((usage.servicesCount / 5) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Clients meter */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Clientes en CRM</span>
              <span className="font-bold text-white">
                {usage.clientsCount} / {isPro ? '∞' : planConfig.maxClients}
              </span>
            </div>
            {!isPro && (
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${Math.min((usage.clientsCount / 50) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Gallery meter */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Fotos en Galería</span>
              <span className="font-bold text-white">
                {usage.galleryCount} / {isPro ? '∞' : planConfig.maxGalleryImages}
              </span>
            </div>
            {!isPro && (
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500"
                  style={{ width: `${Math.min((usage.galleryCount / 10) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Gratuito</span>
            <h3 className="text-2xl font-bold text-white mt-1 mb-4">Free</h3>
            <div className="text-4xl font-extrabold text-white mb-6">$0 <span className="text-sm font-normal text-slate-400">/ siempre</span></div>

            <ul className="space-y-3 text-sm text-slate-300 mb-8">
              <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Hasta 5 servicios publicados</span></li>
              <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Hasta 50 clientes en CRM</span></li>
              <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Galería de 10 fotos</span></li>
              <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Página `espejos.cl/{'{slug}'}`</span></li>
            </ul>
          </div>

          {!isPro ? (
            <button disabled className="w-full py-3 bg-slate-800 text-slate-500 text-center font-semibold rounded-xl cursor-default">
              Tu Plan Actual
            </button>
          ) : (
            <button
              onClick={() => handleUpgradePlan('free')}
              disabled={isUpgrading}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-semibold rounded-xl transition-colors"
            >
              Cambiar a Plan Free
            </button>
          )}
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-indigo-950/70 to-purple-950/50 border border-indigo-500/40 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-indigo-950/50">
          <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-extrabold uppercase px-3.5 py-1 rounded-full tracking-wide">
            Recomendado
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Plan Profesional</span>
            <h3 className="text-2xl font-bold text-white mt-1 mb-4">Espejos Studio Pro</h3>
            <div className="text-4xl font-extrabold text-white mb-6">$9.900 <span className="text-sm font-normal text-slate-400">CLP / mes</span></div>

            <ul className="space-y-3 text-sm text-slate-200 mb-8">
              <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /><span>Servicios y clientes **ilimitados**</span></li>
              <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /><span>Sincronización completa con Google Calendar</span></li>
              <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /><span>Auto-publicación de fotos desde carpeta local</span></li>
              <li className="flex items-center space-x-3"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /><span>Ficha técnica inteligente con tags</span></li>
            </ul>
          </div>

          {isPro ? (
            <button disabled className="w-full py-3 bg-indigo-600/50 text-indigo-200 text-center font-bold rounded-xl cursor-default">
              Tu Plan Pro está Activo
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-center font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>Actualizar a Plan Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Simulation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] mb-4">
              <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Upgrade a Espejos Pro</h3>
            <p className="text-slate-400 text-xs mb-6">
              Suscripción mensual de $9.900 CLP • Cancela cuando quieras
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">Integración Pasarela de Pago</span>
              </div>
              <p className="text-slate-400">
                (Hooks listos para Webpay Plus / Mercado Pago / Flow en producción)
              </p>
            </div>

            <button
              onClick={() => handleUpgradePlan('pro')}
              disabled={isUpgrading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isUpgrading ? (
                <span>Procesando Upgrade...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Confirmar & Activar Plan Pro</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
