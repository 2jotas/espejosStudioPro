import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, RefreshCw, User, Phone, Sliders, Lock } from 'lucide-react';

export interface AppointmentItem {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  clientNote?: string;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  service: {
    name: string;
    durationMinutes: number;
    price: number;
  };
}

export default function CalendarManager() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Business Schedule State (Default: 10:00 - 20:00, Tuesday & Wednesday OFF, 10:00 & 20:00 locked)
  const [disabledDays, setDisabledDays] = useState<number[]>([2, 3]); // 2: Tuesday, 3: Wednesday

  const daysOfWeek = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes', defaultOff: true },
    { id: 3, name: 'Miércoles', defaultOff: true },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' },
  ];

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (e) {
      console.error('Error cargando citas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status } : app))
        );
      }
    } catch (e) {
      console.error('Error actualizando estado:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleDayAvailability = (dayId: number) => {
    setDisabledDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  // Filter appointments for selected date
  const filteredAppointments = appointments.filter((app) => {
    const appDate = new Date(app.startsAt).toISOString().split('T')[0];
    return appDate === selectedDate;
  });

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <span>Calendario de Reservas & Horarios</span>
          </h2>
          <p className="text-slate-400 text-sm">Gestiona tus citas reservadas y configura la disponibilidad semanal de tu espacio</p>
        </div>

        <button
          onClick={fetchAppointments}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-2 w-fit transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Citas</span>
        </button>
      </div>

      {/* Schedule & Rules Configuration Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Configuración de Horario (10:00 AM - 20:00 PM)</span>
        </div>

        {/* Days Availability Toggles */}
        <div className="space-y-2">
          <span className="text-xs text-slate-400 font-medium block">Días Disponibles para Reserva:</span>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => {
              const isDisabled = disabledDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDayAvailability(day.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center space-x-1.5 ${
                    isDisabled
                      ? 'bg-slate-950 text-slate-500 border-slate-800 line-through'
                      : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                  }`}
                >
                  <span>{day.name}</span>
                  {isDisabled && <span className="text-[10px] text-rose-400 font-mono">(Cerrado)</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            * Martes y Miércoles desactivados por defecto. Haz clic sobre cualquier día para activar o desactivar su disponibilidad.
          </p>
        </div>

        {/* Locked Slots Info */}
        <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Horarios Reservados Automáticos:</strong> Las <strong>10:00 AM</strong> y las <strong>20:00 PM</strong> están siempre bloqueadas por defecto para mantenimiento de equipo y preparación del espacio.
          </span>
        </div>
      </div>

      {/* Date Picker Selector */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Filtrar por fecha:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          {filteredAppointments.length} cita(s) en esta fecha
        </span>
      </div>

      {/* Appointments List Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No hay citas reservadas para este día</h3>
          <p className="text-xs max-w-sm mx-auto">
            Los clientes que agenden desde tu enlace público aparecerán automáticamente listados en este calendario.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => {
            const start = new Date(app.startsAt);
            const end = new Date(app.endsAt);
            const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            return (
              <div
                key={app.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <User className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-sm">
                        {app.client.firstName} {app.client.lastName}
                      </h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                          app.status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : app.status === 'completed'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {app.status === 'confirmed' ? 'Confirmada' : app.status === 'completed' ? 'Completada' : 'Cancelada'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center space-x-1 text-indigo-300 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeStr}</span>
                      </span>
                      <span>Servicio: <strong className="text-slate-200">{app.service.name}</strong> (${app.service.price} CLP)</span>
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{app.client.phone}</span>
                      </span>
                    </div>

                    {app.clientNote && (
                      <p className="text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 w-fit">
                        Nota: "{app.clientNote}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {app.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'completed')}
                        disabled={updatingId === app.id}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completada</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                        disabled={updatingId === app.id}
                        className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
