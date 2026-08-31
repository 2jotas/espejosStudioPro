import { useState, useEffect } from 'react';
import { Calendar, Users, Scissors, DollarSign, Clock, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppointmentItem } from './CalendarManager';

export default function DashboardManager() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [appRes, clientRes, serviceRes] = await Promise.all([
          fetch('/api/appointments'),
          fetch('/api/clients'),
          fetch('/api/services'),
        ]);

        if (appRes.ok) {
          const data = await appRes.json();
          setAppointments(data.appointments || []);
        }

        if (clientRes.ok) {
          const data = await clientRes.json();
          setClientCount(data.clients?.length || 0);
        }

        if (serviceRes.ok) {
          const data = await serviceRes.json();
          setServiceCount(data.services?.length || 0);
        }
      } catch (e) {
        console.error('Error cargando datos del dashboard:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const todayAppointments = appointments.filter((app) => {
    const d = new Date(app.startsAt);
    const appDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return appDate === todayStr && app.status !== 'cancelled';
  });

  const totalRevenue = appointments
    .filter((app) => app.status === 'confirmed' || app.status === 'completed')
    .reduce((sum, app) => sum + (app.service?.price || 0), 0);

  return (
    <div className="space-y-8 text-left">
      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase">Citas de Hoy</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            {isLoading ? '...' : todayAppointments.length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Reservas activas hoy</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase">Clientes Activos</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            {isLoading ? '...' : clientCount}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">En base de datos CRM</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase">Servicios</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            {isLoading ? '...' : serviceCount}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Disponibles online</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase">Ingresos Estimados</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            ${isLoading ? '...' : totalRevenue.toLocaleString('es-CL')}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Total citas confirmadas</span>
        </div>
      </div>

      {/* Today's Appointments List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Próximas Citas de Hoy</h3>
            <p className="text-slate-400 text-xs">Monitoreo en tiempo real de tus clientes agendados para hoy</p>
          </div>
          <a
            href={`/${user?.slug}?preview=true`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>Ver mi página pública</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs">No tienes más citas programadas para hoy.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((app) => {
              const start = new Date(app.startsAt);
              const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={app.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                      {timeStr}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-xs">
                        {app.client.firstName} {app.client.lastName}
                      </h4>
                      <span className="text-[11px] text-slate-400">{app.service.name} (${app.service.price} CLP)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Confirmada
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
