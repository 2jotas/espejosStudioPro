import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Clock, Calendar, Users, Percent, Sparkles, ExternalLink, RefreshCw, ArrowUpRight, MessageCircle, Copy, Check
} from 'lucide-react';

interface DashboardMetrics {
  timeframeRevenue: number;
  todayRevenue: number;
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  averageTicket: number;
  profitabilityPerMinute: number;
  capacityUtilizationRate: number;
  totalClients: number;
  recurringClients: number;
  retentionRate: number;
}

interface ServiceRanking {
  name: string;
  price: number;
  count: number;
  totalRevenue: number;
}

interface TodayAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  serviceName: string;
  servicePrice: number;
  clientName: string;
  clientPhone: string;
  clientNote?: string;
}

interface DashboardData {
  timeframe: 'today' | 'week' | 'month' | 'all';
  metrics: DashboardMetrics;
  topServices: ServiceRanking[];
  todayUpcoming: TodayAppointment[];
}

export default function DashboardTab({ professionalSlug }: { professionalSlug: string }) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('espejos_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/dashboard/stats?timeframe=${timeframe}`, { headers });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [timeframe]);

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/${professionalSlug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Timeframe Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Panel de Inteligencia Comercial</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Métricas financieras, rendimiento por hora e indicadores de retención
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector Pills */}
          <div className="inline-flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            {(['today', 'week', 'month', 'all'] as const).map((t) => {
              const labels = { today: 'Hoy', week: 'Esta Semana', month: 'Este Mes', all: 'Histórico' };
              const isActive = timeframe === t;
              return (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchDashboardStats}
            className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 PRIMARY METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ingresos del Período</span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-400 font-mono tracking-tight">
            ${data ? data.metrics.timeframeRevenue.toLocaleString('es-CL') : '0'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span>Hoy generado:</span>
            <span className="font-bold text-white font-mono">${data ? data.metrics.todayRevenue.toLocaleString('es-CL') : '0'}</span>
          </div>
        </div>

        {/* Card 2: Average Ticket */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ticket Promedio (ARPU)</span>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-white font-mono tracking-tight">
            ${data ? data.metrics.averageTicket.toLocaleString('es-CL') : '0'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span>Por cliente atendido</span>
            <span className="text-indigo-400 font-bold">{data ? data.metrics.confirmedAppointments : 0} citas</span>
          </div>
        </div>

        {/* Card 3: Profitability per Minute */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rentabilidad / Minuto</span>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-purple-300 font-mono tracking-tight">
            ${data ? data.metrics.profitabilityPerMinute.toLocaleString('es-CL') : '0'}<span className="text-xs text-slate-400 font-sans font-normal">/min</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span>Eficiencia operativa</span>
            <span className="text-purple-400 font-bold">Tiempo vendible</span>
          </div>
        </div>

        {/* Card 4: Schedule Occupancy */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ocupación de Agenda</span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-amber-400 font-mono tracking-tight">
            {data ? data.metrics.capacityUtilizationRate : 0}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span>Capacidad instalada</span>
            <span className="text-amber-400 font-bold">{data ? data.metrics.totalAppointments : 0} reservas</span>
          </div>
        </div>

      </div>

      {/* SECONDARY ANALYTICS SECTION: 2 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Top Performing Services & Retention (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Service Profitability Ranking */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Servicios Más Rentables (Pareto)</h3>
                <p className="text-slate-400 text-xs">Ranking de servicios ordenados por volumen de ingresos</p>
              </div>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
                RECAUDACIÓN
              </span>
            </div>

            <div className="space-y-3.5 pt-2">
              {!data || data.topServices.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No hay servicios registrados en este período.
                </div>
              ) : (
                data.topServices.map((service, index) => {
                  const maxRevenue = data.topServices[0]?.totalRevenue || 1;
                  const percentage = Math.round((service.totalRevenue / maxRevenue) * 100);

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                            {index + 1}
                          </span>
                          <span className="font-bold text-white">{service.name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">({service.count} citas)</span>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono">${service.totalRevenue.toLocaleString('es-CL')}</span>
                      </div>

                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Client Retention & Loyalty Metrics */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Retención de Clientes</span>
              </div>
              <div className="text-4xl font-extrabold text-white">
                {data ? data.metrics.retentionRate : 0}%
              </div>
              <p className="text-slate-400 text-xs">
                Porcentaje de clientes que han vuelto más de 1 vez a tu espacio.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total en CRM:</span>
                <span className="font-bold text-white">{data ? data.metrics.totalClients : 0} clientes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Recurrentes (Fidelizados):</span>
                <span className="font-bold text-purple-400">{data ? data.metrics.recurringClients : 0} clientes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nuevos:</span>
                <span className="font-bold text-emerald-400">
                  {data ? data.metrics.totalClients - data.metrics.recurringClients : 0} clientes
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Column 3: Today's Schedule & Quick Action Hub (1/3 Width) */}
        <div className="space-y-6">
          
          {/* Quick Actions Bar */}
          <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-purple-900/40 border border-indigo-500/20 rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Acciones Rápidas</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={handleCopyPublicLink}
                className="w-full py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs rounded-xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Enlace Web</span>
                </div>
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5 opacity-60" />}
              </button>

              <a
                href={`/${professionalSlug}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-between transition-all"
              >
                <span>Ver Mi Página Pública</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Today's Live Schedule */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Citas de Hoy</h3>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {data ? data.todayUpcoming.length : 0} hoy
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {!data || data.todayUpcoming.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs space-y-2">
                  <p>No tienes reservas agendadas para hoy.</p>
                </div>
              ) : (
                data.todayUpcoming.map((app) => {
                  const startTime = new Date(app.startsAt).toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={app.id}
                      className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                          {startTime}
                        </span>
                        <span className="font-mono font-bold text-emerald-400">${app.servicePrice.toLocaleString('es-CL')}</span>
                      </div>

                      <div>
                        <div className="font-bold text-white text-xs">{app.clientName}</div>
                        <div className="text-slate-400 text-[11px]">{app.serviceName}</div>
                      </div>

                      {app.clientPhone && (
                        <div className="pt-1 flex items-center justify-between border-t border-slate-900 text-[11px]">
                          <span className="text-slate-500 font-mono">{app.clientPhone}</span>
                          <a
                            href={`https://wa.me/${app.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hola ${app.clientName}, te recordamos tu cita de hoy a las ${startTime} en Espejos Studio.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
