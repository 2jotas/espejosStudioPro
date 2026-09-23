import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Clock, Calendar, Users, Percent, Sparkles, ExternalLink, RefreshCw, ArrowUpRight, MessageCircle, Copy, Check, Info, X, Lightbulb, Target, HelpCircle
} from 'lucide-react';

export interface MetricExplainer {
  id: string;
  title: string;
  badge: string;
  whatIsIt: string;
  whyItMatters: string;
  howToImprove: string;
}

export const METRIC_EXPLAINERS: Record<string, MetricExplainer> = {
  revenue: {
    id: 'revenue',
    title: 'Ingresos del Período',
    badge: 'Facturación Total',
    whatIsIt: 'Es la suma neta de dinero recaudado por todas las citas completadas durante el período seleccionado.',
    whyItMatters: 'Te da el pulso real de la salud financiera de tu negocio y te permite proyectar tus metas de ahorro e inversión.',
    howToImprove: 'Compara semanas consecutivas para detectar tus días de menor flujo y lanza promociones específicas para esos días.',
  },
  arpu: {
    id: 'arpu',
    title: 'Ticket Promedio (ARPU)',
    badge: 'Gasto Medio por Cliente',
    whatIsIt: 'ARPU significa "Average Revenue Per User" (Ingreso Promedio por Usuario). Es la cantidad promedio de dinero que te deja cada cliente en una sola visita.',
    whyItMatters: 'Subir tu ticket promedio es la forma más rápida y descansada de ganar más dinero: ganas más con la misma cantidad de clientes sin tener que trabajar horas extra.',
    howToImprove: 'Ofrece servicios complementarios mientras atiendes (ej. "¿Le sumamos perfilado de barba con toalla tibia?" o venta de cera/aceite al cobrar). Subir $3.000 por ticket son cientos de miles a fin de mes.',
  },
  profitability: {
    id: 'profitability',
    title: 'Rentabilidad por Minuto',
    badge: 'Valor de tu Tiempo en Sillón',
    whatIsIt: 'Cuánto dinero genera tu negocio por cada minuto que estás atendiendo con tijera o máquina en mano (ej. $25.000 por un corte de 40 min = $625/minuto).',
    whyItMatters: 'Te revela qué servicios te dejan más ganancia real por hora de trabajo y cuáles consumen mucho tiempo con poco margen.',
    howToImprove: 'Optimiza los tiempos muertos entre citas y ajusta los precios de aquellos servicios que tomen más de 45 minutos para que tu minuto en sillón siempre sea rentable.',
  },
  occupancy: {
    id: 'occupancy',
    title: 'Ocupación de Agenda',
    badge: 'Capacidad Instalada Vendida',
    whatIsIt: 'El porcentaje de tu horario laboral disponible que realmente estuvo ocupado con clientes atendidos.',
    whyItMatters: 'Te indica si tienes huecos vacíos para recibir más clientes o si tu agenda está saturada y es momento de subir tarifas.',
    howToImprove: 'Si estás bajo el 65%, contacta a clientes que no vienen hace 3 semanas. Si estás sobre el 85%, tu demanda es alta: puedes subir precios con total tranquilidad.',
  },
  pareto: {
    id: 'pareto',
    title: 'Servicios Más Rentables (Ley de Pareto)',
    badge: 'Principio del 80 / 20',
    whatIsIt: 'La Ley de Pareto es una regla de oro en los negocios que demuestra que el 80% de tus ingresos proviene de sólo el 20% de tus servicios estrella.',
    whyItMatters: 'Te ayuda a no desgastarte ofreciendo mil servicios complejos y enfocarte en los 2 o 3 cortes y rituales que realmente pagan tus cuentas.',
    howToImprove: 'Coloca tus 2 servicios más rentables al inicio de tu menú de agendamiento y en las fotos principales de tu galería para que los nuevos clientes los elijan primero.',
  },
  retention: {
    id: 'retention',
    title: 'Tasa de Retención de Clientes',
    badge: '% de Clientes Fidelizados',
    whatIsIt: 'El porcentaje de clientes que han vuelto a cortarse contigo 2 o más veces en comparación con los que vinieron una sola vez.',
    whyItMatters: 'Es el indicador supremo de calidad de un barbero o estilista. Es 5 veces más barato y fácil retener a un cliente fiel que salir a buscar clientes nuevos.',
    howToImprove: 'Asegura una experiencia impecable, agenda su próxima cita antes de que salga del sillón y envíale un WhatsApp de saludo a los 20 días para recordarle su corte.',
  }
};

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

const DEMO_DASHBOARD_DATA: Record<string, DashboardData> = {
  month: {
    timeframe: 'month',
    metrics: {
      timeframeRevenue: 1850000,
      todayRevenue: 95000,
      totalAppointments: 94,
      confirmedAppointments: 82,
      completedAppointments: 78,
      averageTicket: 19680,
      profitabilityPerMinute: 656,
      capacityUtilizationRate: 84,
      totalClients: 64,
      recurringClients: 48,
      retentionRate: 75,
    },
    topServices: [
      { name: 'Corte de Autor + Perfilado de Barba', price: 25000, count: 42, totalRevenue: 1050000 },
      { name: 'Degradado / Skin Fade Clásico', price: 18000, count: 32, totalRevenue: 576000 },
      { name: 'Perfilado de Barba con Toalla Caliente', price: 14000, count: 14, totalRevenue: 196000 },
      { name: 'Asesoría Visagismo & Estilo', price: 28000, count: 6, totalRevenue: 168000 },
    ],
    todayUpcoming: [
      { id: 'demo-1', startsAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 105).toISOString(), status: 'confirmed', serviceName: 'Corte de Autor + Barba', servicePrice: 25000, clientName: 'Matías Silva', clientPhone: '+56 9 8765 4321', clientNote: 'Degradado medio en punta' },
      { id: 'demo-2', startsAt: new Date(Date.now() + 1000 * 60 * 150).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 185).toISOString(), status: 'confirmed', serviceName: 'Degradado Skin Fade', servicePrice: 18000, clientName: 'Carlos Vega', clientPhone: '+56 9 7654 3210', clientNote: 'Cliente habitual' },
      { id: 'demo-3', startsAt: new Date(Date.now() + 1000 * 60 * 240).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 285).toISOString(), status: 'pending', serviceName: 'Perfilado de Barba', servicePrice: 14000, clientName: 'Ignacio Rojas', clientPhone: '+56 9 6543 2109' },
    ]
  },
  today: {
    timeframe: 'today',
    metrics: {
      timeframeRevenue: 95000,
      todayRevenue: 95000,
      totalAppointments: 5,
      confirmedAppointments: 4,
      completedAppointments: 2,
      averageTicket: 19000,
      profitabilityPerMinute: 633,
      capacityUtilizationRate: 80,
      totalClients: 5,
      recurringClients: 3,
      retentionRate: 60,
    },
    topServices: [
      { name: 'Corte de Autor + Perfilado de Barba', price: 25000, count: 2, totalRevenue: 50000 },
      { name: 'Degradado / Skin Fade Clásico', price: 18000, count: 2, totalRevenue: 36000 },
      { name: 'Perfilado de Barba con Toalla Caliente', price: 14000, count: 1, totalRevenue: 14000 },
    ],
    todayUpcoming: [
      { id: 'demo-1', startsAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 105).toISOString(), status: 'confirmed', serviceName: 'Corte de Autor + Barba', servicePrice: 25000, clientName: 'Matías Silva', clientPhone: '+56 9 8765 4321', clientNote: 'Degradado medio en punta' },
      { id: 'demo-2', startsAt: new Date(Date.now() + 1000 * 60 * 150).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 185).toISOString(), status: 'confirmed', serviceName: 'Degradado Skin Fade', servicePrice: 18000, clientName: 'Carlos Vega', clientPhone: '+56 9 7654 3210' },
      { id: 'demo-3', startsAt: new Date(Date.now() + 1000 * 60 * 240).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 285).toISOString(), status: 'pending', serviceName: 'Perfilado de Barba', servicePrice: 14000, clientName: 'Ignacio Rojas', clientPhone: '+56 9 6543 2109' },
    ]
  },
  week: {
    timeframe: 'week',
    metrics: {
      timeframeRevenue: 480000,
      todayRevenue: 95000,
      totalAppointments: 24,
      confirmedAppointments: 22,
      completedAppointments: 18,
      averageTicket: 20000,
      profitabilityPerMinute: 666,
      capacityUtilizationRate: 85,
      totalClients: 20,
      recurringClients: 15,
      retentionRate: 75,
    },
    topServices: [
      { name: 'Corte de Autor + Perfilado de Barba', price: 25000, count: 10, totalRevenue: 250000 },
      { name: 'Degradado / Skin Fade Clásico', price: 18000, count: 8, totalRevenue: 144000 },
      { name: 'Perfilado de Barba con Toalla Caliente', price: 14000, count: 4, totalRevenue: 56000 },
      { name: 'Asesoría Visagismo & Estilo', price: 28000, count: 2, totalRevenue: 56000 },
    ],
    todayUpcoming: [
      { id: 'demo-1', startsAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 105).toISOString(), status: 'confirmed', serviceName: 'Corte de Autor + Barba', servicePrice: 25000, clientName: 'Matías Silva', clientPhone: '+56 9 8765 4321' },
      { id: 'demo-2', startsAt: new Date(Date.now() + 1000 * 60 * 150).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 185).toISOString(), status: 'confirmed', serviceName: 'Degradado Skin Fade', servicePrice: 18000, clientName: 'Carlos Vega', clientPhone: '+56 9 7654 3210' },
    ]
  },
  all: {
    timeframe: 'all',
    metrics: {
      timeframeRevenue: 8450000,
      todayRevenue: 95000,
      totalAppointments: 430,
      confirmedAppointments: 410,
      completedAppointments: 395,
      averageTicket: 19650,
      profitabilityPerMinute: 655,
      capacityUtilizationRate: 82,
      totalClients: 210,
      recurringClients: 160,
      retentionRate: 76,
    },
    topServices: [
      { name: 'Corte de Autor + Perfilado de Barba', price: 25000, count: 180, totalRevenue: 4500000 },
      { name: 'Degradado / Skin Fade Clásico', price: 18000, count: 150, totalRevenue: 2700000 },
      { name: 'Perfilado de Barba con Toalla Caliente', price: 14000, count: 60, totalRevenue: 840000 },
      { name: 'Asesoría Visagismo & Estilo', price: 28000, count: 25, totalRevenue: 700000 },
    ],
    todayUpcoming: [
      { id: 'demo-1', startsAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 105).toISOString(), status: 'confirmed', serviceName: 'Corte de Autor + Barba', servicePrice: 25000, clientName: 'Matías Silva', clientPhone: '+56 9 8765 4321' },
    ]
  }
};

export default function DashboardTab({ professionalSlug, isDemo }: { professionalSlug: string; isDemo?: boolean }) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeExplainer, setActiveExplainer] = useState<MetricExplainer | null>(null);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    if (isDemo || professionalSlug === 'demo') {
      setData(DEMO_DASHBOARD_DATA[timeframe] || DEMO_DASHBOARD_DATA.month);
      setIsLoading(false);
      return;
    }

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
  }, [timeframe, isDemo, professionalSlug]);

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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
            className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 PRIMARY METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ingresos del Período</span>
                <button
                  onClick={() => setActiveExplainer(METRIC_EXPLAINERS.revenue)}
                  className="p-1 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  title="¿Qué significa este dato?"
                  aria-label="Ver explicación de Ingresos"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-400 font-mono tracking-tight">
              ${data ? data.metrics.timeframeRevenue.toLocaleString('es-CL') : '0'}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span>Hoy generado:</span>
            <span className="font-bold text-white font-mono">${data ? data.metrics.todayRevenue.toLocaleString('es-CL') : '0'}</span>
          </div>
        </div>

        {/* Card 2: Average Ticket */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ticket Promedio (ARPU)</span>
                <button
                  onClick={() => setActiveExplainer(METRIC_EXPLAINERS.arpu)}
                  className="p-1 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                  title="¿Qué significa ARPU y cómo usarlo?"
                  aria-label="Ver explicación de ARPU"
                >
                  <Info className="w-3.5 h-3.5 animate-pulse" />
                </button>
              </div>
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono tracking-tight">
              ${data ? data.metrics.averageTicket.toLocaleString('es-CL') : '0'}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span>Por cliente atendido</span>
            <span className="text-indigo-400 font-bold">{data ? data.metrics.confirmedAppointments : 0} citas</span>
          </div>
        </div>

        {/* Card 3: Profitability per Minute */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rentabilidad / Minuto</span>
                <button
                  onClick={() => setActiveExplainer(METRIC_EXPLAINERS.profitability)}
                  className="p-1 rounded-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
                  title="¿Cómo se calcula el valor por minuto?"
                  aria-label="Ver explicación de Rentabilidad por Minuto"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-purple-300 font-mono tracking-tight">
              ${data ? data.metrics.profitabilityPerMinute.toLocaleString('es-CL') : '0'}<span className="text-xs text-slate-400 font-sans font-normal">/min</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span>Eficiencia operativa</span>
            <span className="text-purple-400 font-bold">Tiempo vendible</span>
          </div>
        </div>

        {/* Card 4: Schedule Occupancy */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ocupación de Agenda</span>
                <button
                  onClick={() => setActiveExplainer(METRIC_EXPLAINERS.occupancy)}
                  className="p-1 rounded-full text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
                  title="¿Qué es la capacidad instalada?"
                  aria-label="Ver explicación de Ocupación"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-amber-400 font-mono tracking-tight">
              {data ? data.metrics.capacityUtilizationRate : 0}%
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
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
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">Servicios Más Rentables (Pareto)</h3>
                  <button
                    onClick={() => setActiveExplainer(METRIC_EXPLAINERS.pareto)}
                    className="p-1 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                    title="¿Qué es la ley de Pareto 80/20?"
                    aria-label="Ver explicación de Pareto"
                  >
                    <Info className="w-3.5 h-3.5 animate-pulse" />
                  </button>
                </div>
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
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Retención de Clientes</span>
                <button
                  onClick={() => setActiveExplainer(METRIC_EXPLAINERS.retention)}
                  className="p-1 rounded-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
                  title="¿Qué es la tasa de retención?"
                  aria-label="Ver explicación de Retención"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
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
                className="w-full py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer"
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

      {/* EDUCATIONAL METRIC EXPLAINER MODAL (Desktop & Mobile) */}
      {activeExplainer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveExplainer(null)}
        >
          <div 
            className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative shadow-indigo-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                  {activeExplainer.badge}
                </span>
                <h3 className="text-lg font-black text-white">{activeExplainer.title}</h3>
              </div>
              <button
                onClick={() => setActiveExplainer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Cerrar explicación"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Section Blocks */}
            <div className="space-y-3.5 text-xs">
              
              {/* ¿Qué es? */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-bold">
                  <HelpCircle className="w-4 h-4" />
                  <span>¿Qué es este dato?</span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-5">
                  {activeExplainer.whatIsIt}
                </p>
              </div>

              {/* ¿Para qué sirve? */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center space-x-1.5 text-purple-400 font-bold">
                  <Target className="w-4 h-4" />
                  <span>¿Para qué te sirve en tu barbería?</span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-5">
                  {activeExplainer.whyItMatters}
                </p>
              </div>

              {/* ¿Cómo mejorarlo? */}
              <div className="p-3.5 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/25 rounded-2xl space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                  <Lightbulb className="w-4 h-4" />
                  <span>¿Cómo mejorarlo y ganar más?</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed pl-5 font-medium">
                  {activeExplainer.howToImprove}
                </p>
              </div>

            </div>

            {/* Footer Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveExplainer(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
