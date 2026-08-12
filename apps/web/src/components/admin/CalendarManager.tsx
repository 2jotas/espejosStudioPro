import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, User, Phone, Sliders, Plus, Edit2, Trash2, CalendarDays, Grid, ListFilter, FileText, Check, AlertCircle } from 'lucide-react';
import { ServiceItem } from './ServicesManager';

export interface AppointmentItem {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  clientNote?: string;
  googleCalendarEventId?: string | null;
  client: {
    id?: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  };
}

export type CalendarViewMode = 'day' | 'week' | 'month';

export default function CalendarManager() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Business Schedule State (Default: 10:00 - 20:00, Tuesday & Wednesday OFF)
  const [disabledDays, setDisabledDays] = useState<number[]>([2, 3]); // 2: Tuesday, 3: Wednesday
  const [disabledSpecificDates, setDisabledSpecificDates] = useState<string[]>([]); // YYYY-MM-DD override

  // Modal State for Client Technical Profile & Reassign CRM
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [activeAppForProfile, setActiveAppForProfile] = useState<AppointmentItem | null>(null);
  const [allCrmClients, setAllCrmClients] = useState<Array<{ id: string; firstName: string; lastName: string; phone: string }>>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [editClientFirstName, setEditClientFirstName] = useState('');
  const [editClientLastName, setEditClientLastName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [isSavingTechProfile, setIsSavingTechProfile] = useState(false);
  const [techProfileMsg, setTechProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openClientProfileModal = async (app: AppointmentItem) => {
    setActiveAppForProfile(app);
    setEditClientFirstName(app.client.firstName || '');
    setEditClientLastName(app.client.lastName || '');
    setEditClientPhone(app.client.phone || '');
    setTechnicalNotes('');
    setClientSearchQuery('');
    setTechProfileMsg(null);
    setIsClientModalOpen(true);

    try {
      // Fetch all clients to allow searching & reassigning
      const clientRes = await fetch('/api/clients');
      if (clientRes.ok) {
        const data = await clientRes.json();
        setAllCrmClients(data.clients || []);
      }

      // Fetch client profile notes
      if (app.client.id) {
        const singleClientRes = await fetch(`/api/clients/${app.client.id}`);
        if (singleClientRes.ok) {
          const cData = await singleClientRes.json();
          setTechnicalNotes(cData.client?.profile?.notes || '');
          if (cData.client?.firstName) setEditClientFirstName(cData.client.firstName);
          if (cData.client?.lastName) setEditClientLastName(cData.client.lastName);
          if (cData.client?.phone) setEditClientPhone(cData.client.phone);
        }
      }
    } catch (e) {
      console.error('Error cargando ficha de cliente:', e);
    }
  };

  const handleSaveClientDetailsAndNotes = async () => {
    if (!activeAppForProfile) return;
    try {
      setIsSavingTechProfile(true);
      setTechProfileMsg(null);

      // 1. Update Appointment Client Name & Phone
      const updateAppRes = await fetch(`/api/appointments/${activeAppForProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientFirstName: editClientFirstName,
          clientLastName: editClientLastName,
          clientPhone: editClientPhone,
        }),
      });

      if (!updateAppRes.ok) throw new Error('Error al actualizar datos del cliente');

      // 2. Save Technical Notes if Client ID exists
      if (activeAppForProfile.client.id) {
        await fetch(`/api/clients/${activeAppForProfile.client.id}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: technicalNotes }),
        });
      }

      await fetchAppointments();
      setTechProfileMsg({ type: 'success', text: '¡Cliente y Ficha Técnica guardados e integrados exitosamente en la base de datos!' });
    } catch (e: any) {
      setTechProfileMsg({ type: 'error', text: e.message || 'Error guardando datos' });
    } finally {
      setIsSavingTechProfile(false);
    }
  };

  const handleReassignClientToAppointment = async (targetClientId: string) => {
    if (!activeAppForProfile || !targetClientId) return;
    try {
      setIsSavingTechProfile(true);
      setTechProfileMsg(null);

      const res = await fetch(`/api/appointments/${activeAppForProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: targetClientId }),
      });

      if (!res.ok) throw new Error('Error al vincular el cliente');

      await fetchAppointments();
      setTechProfileMsg({ type: 'success', text: 'Cita vinculada exitosamente al historial del cliente seleccionado' });
    } catch (e: any) {
      setTechProfileMsg({ type: 'error', text: e.message });
    } finally {
      setIsSavingTechProfile(false);
    }
  };
  // Modal State for New / Edit Appointment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentItem | null>(null);
  const [formClientFirstName, setFormClientFirstName] = useState('');
  const [formClientLastName, setFormClientLastName] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState('11:00');
  const [formEndTime, setFormEndTime] = useState('12:00');
  const [formNote, setFormNote] = useState('');
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);

  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

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
      const [appRes, serviceRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/services'),
      ]);

      if (appRes.ok) {
        const data = await appRes.json();
        setAppointments(data.appointments || []);
      }

      if (serviceRes.ok) {
        const data = await serviceRes.json();
        const activeServices = (data.services || []).filter((s: ServiceItem) => s.active);
        setServices(activeServices);
        if (activeServices.length > 0 && !formServiceId) {
          setFormServiceId(activeServices[0].id);
        }
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

  const handleSyncGoogleEvents = async () => {
    try {
      setIsSyncingGoogle(true);
      setSyncMessage(null);
      const res = await fetch('/api/calendar/sync-events', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al sincronizar con Google Calendar');
      }

      setSyncMessage(data.message);
      await fetchAppointments();
    } catch (e: any) {
      setSyncMessage(e.message || 'Error de sincronización');
    } finally {
      setIsSyncingGoogle(false);
    }
  };

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

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta cita de la base de datos?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments((prev) => prev.filter((app) => app.id !== id));
      }
    } catch (e) {
      console.error('Error eliminando cita:', e);
    }
  };

  const toggleDayAvailability = (dayId: number) => {
    setDisabledDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const toggleSpecificDateAvailability = (dateStr: string) => {
    setDisabledSpecificDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const current = new Date(`${selectedDate}T12:00:00Z`);
    current.setUTCDate(current.getUTCDate() - (viewMode === 'week' ? 7 : 1));
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(`${selectedDate}T12:00:00Z`);
    current.setUTCDate(current.getUTCDate() + (viewMode === 'week' ? 7 : 1));
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Open Modal for New Appointment
  const openNewModal = (defaultTime = '11:00') => {
    setEditingAppointment(null);
    setFormClientFirstName('');
    setFormClientLastName('');
    setFormClientPhone('');
    setFormDate(selectedDate);
    setFormStartTime(defaultTime);
    setFormEndTime(`${parseInt(defaultTime.split(':')[0], 10) + 1}:00`);
    setFormNote('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit Appointment
  const openEditModal = (app: AppointmentItem) => {
    setEditingAppointment(app);
    setFormClientFirstName(app.client.firstName);
    setFormClientLastName(app.client.lastName);
    setFormClientPhone(app.client.phone);
    setFormServiceId(app.service.id);

    const start = new Date(app.startsAt);
    const end = new Date(app.endsAt);
    setFormDate(start.toISOString().split('T')[0]);
    setFormStartTime(start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    setFormEndTime(end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    setFormNote(app.clientNote || '');
    setIsModalOpen(true);
  };

  // Save Appointment (Create or Edit)
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientFirstName || !formClientLastName || !formServiceId || !formDate || !formStartTime) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsSavingAppointment(true);
      const startsAtIso = new Date(`${formDate}T${formStartTime}:00Z`).toISOString();
      const endsAtIso = new Date(`${formDate}T${formEndTime || formStartTime}:00Z`).toISOString();

      if (editingAppointment) {
        // Edit existing
        const res = await fetch(`/api/appointments/${editingAppointment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: formServiceId,
            startsAtIso,
            endsAtIso,
            clientFirstName: formClientFirstName,
            clientLastName: formClientLastName,
            clientPhone: formClientPhone,
            clientNote: formNote,
          }),
        });

        if (res.ok) {
          await fetchAppointments();
          setIsModalOpen(false);
        }
      } else {
        // Create new
        const res = await fetch('/api/appointments/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: formServiceId,
            startsAtIso,
            endsAtIso,
            clientFirstName: formClientFirstName,
            clientLastName: formClientLastName,
            clientPhone: formClientPhone,
            clientNote: formNote,
          }),
        });

        if (res.ok) {
          await fetchAppointments();
          setIsModalOpen(false);
        }
      }
    } catch (e) {
      console.error('Error guardando cita:', e);
    } finally {
      setIsSavingAppointment(false);
    }
  };

  // Filter appointments for selected date (Day View)
  const dayAppointments = appointments.filter((app) => {
    const appDate = new Date(app.startsAt).toISOString().split('T')[0];
    return appDate === selectedDate;
  });

  const getRelativeDayLabel = (targetDateStr: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

    if (targetDateStr === todayStr) return { text: 'HOY', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (targetDateStr === tomorrowStr) return { text: 'MAÑANA', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    if (targetDateStr === yesterdayStr) return { text: 'AYER', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (targetDateStr === dayAfterTomorrowStr) return { text: 'PASADO MAÑANA', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };

    const target = new Date(`${targetDateStr}T12:00:00Z`);
    const current = new Date(`${todayStr}T12:00:00Z`);
    const diffDays = Math.round((target.getTime() - current.getTime()) / (1000 * 3600 * 24));

    if (diffDays > 0) return { text: `EN ${diffDays} DÍAS`, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    return { text: `HACE ${Math.abs(diffDays)} DÍAS`, color: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  const relativeBadge = getRelativeDayLabel(selectedDate);

  const formattedSelectedDate = new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate week dates (Monday to Sunday)
  const currentSelectedObj = new Date(`${selectedDate}T12:00:00Z`);
  const currentDayOfWeek = currentSelectedObj.getUTCDay(); // 0 is Sun
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentSelectedObj);
    d.setUTCDate(d.getUTCDate() + mondayOffset + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNum = d.getUTCDay();
    return {
      dateStr,
      dayNum,
      dayName: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayNum],
      formattedShort: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
    };
  });

  // Calculate month days grid
  const year = currentSelectedObj.getUTCFullYear();
  const month = currentSelectedObj.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDayOfMonthOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const monthPadOffset = firstDayOfMonthOfWeek === 0 ? 6 : firstDayOfMonthOfWeek - 1;

  const monthGridDays = Array.from({ length: daysInMonth + monthPadOffset }, (_, i) => {
    if (i < monthPadOffset) return null;
    const dayNumber = i - monthPadOffset + 1;
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(dayNumber).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    const dObj = new Date(Date.UTC(year, month, dayNumber));
    const dayNum = dObj.getUTCDay();
    return {
      dateStr,
      dayNumber,
      dayNum,
    };
  });

  return (
    <div className="space-y-8 text-left">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <span>Calendario de Reservas & Horarios</span>
          </h2>
          <p className="text-slate-400 text-sm">Gestiona tus citas, edita horarios y sincroniza con tu Asistente de Google</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => openNewModal('11:00')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>

          <button
            onClick={handleSyncGoogleEvents}
            disabled={isSyncingGoogle}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
            <span>Sincronizar Google</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Schedule Availability Configuration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Configuración de Horario Semanal (10:00 AM - 20:00 PM)</span>
        </div>

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
      </div>

      {/* Calendar Toolbar (View Selector & Navigation Controls) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
        {/* View Mode Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 w-fit">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              viewMode === 'day' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Día</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              viewMode === 'week' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Semana</span>
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              viewMode === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Mes</span>
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevDay}
            className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            ← Anterior
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl transition-all"
          >
            Hoy
          </button>
          <button
            onClick={handleNextDay}
            className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            Siguiente →
          </button>
        </div>

        {/* Date Display */}
        <div className="flex items-center space-x-3">
          <span
            className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-xl border tracking-wide ${relativeBadge.color}`}
          >
            {relativeBadge.text}
          </span>
          <span className="text-xs font-bold text-white capitalize hidden lg:inline">{formattedSelectedDate}</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* RENDER VIEW: DAY VIEW */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="h-32 bg-slate-900/40 border border-slate-800 rounded-3xl animate-pulse" />
          ) : dayAppointments.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-4">
              <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">No hay citas registradas para este día</h3>
                <p className="text-xs max-w-sm mx-auto mt-1">
                  Las citas agendadas por tus clientes o sincronizadas desde tu Google Calendar aparecerán listadas aquí.
                </p>
              </div>
              <button
                onClick={() => openNewModal('11:00')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar cita manualmente</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {dayAppointments.map((app) => {
                const start = new Date(app.startsAt);
                const end = new Date(app.endsAt);
                const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <div
                    key={app.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl hover:border-slate-700 transition-colors"
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

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => openClientProfileModal(app)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
                        title="Ver Ficha Técnica y Vincular con Cliente CRM"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ficha CRM</span>
                      </button>

                      <button
                        onClick={() => openEditModal(app)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
                        title="Editar cita"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      {app.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'completed')}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
                          >
                            Completada
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteAppointment(app.id)}
                        className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl transition-colors"
                        title="Eliminar de base de datos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 overflow-x-auto backdrop-blur-xl">
          <div className="min-w-[700px] grid grid-cols-7 gap-3">
            {weekDays.map((wDay) => {
              const isDisabled = disabledDays.includes(wDay.dayNum);
              const dayApps = appointments.filter((a) => new Date(a.startsAt).toISOString().split('T')[0] === wDay.dateStr);

              return (
                <div key={wDay.dateStr} className={`space-y-3 rounded-2xl p-3 border transition-colors ${wDay.dateStr === selectedDate ? 'bg-indigo-950/30 border-indigo-500/40' : 'bg-slate-950/60 border-slate-800/80'}`}>
                  <div className="border-b border-slate-800 pb-2 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-300">{wDay.dayName}</span>
                    <span className="text-[11px] font-mono text-slate-500">{wDay.formattedShort}</span>
                    <button
                      onClick={() => toggleDayAvailability(wDay.dayNum)}
                      className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDisabled ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
                    >
                      {isDisabled ? 'Cerrado' : 'Abierto'}
                    </button>
                  </div>

                  <div className="space-y-2 min-h-[140px]">
                    {dayApps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => openEditModal(app)}
                        className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 p-2 rounded-xl text-left cursor-pointer transition-all"
                      >
                        <div className="text-[11px] font-bold text-white truncate">
                          {app.client.firstName} {app.client.lastName}
                        </div>
                        <div className="text-[10px] text-indigo-300 font-mono">
                          {new Date(app.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setSelectedDate(wDay.dateStr);
                        openNewModal('11:00');
                      }}
                      className="w-full py-1.5 border border-dashed border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 text-[10px] font-semibold rounded-xl transition-colors"
                    >
                      + Agendar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER VIEW: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-xl space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-3">
            <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthGridDays.map((mDay, idx) => {
              if (!mDay) return <div key={idx} className="h-20 bg-slate-950/20 rounded-2xl border border-slate-900" />;

              const isDisabled = disabledDays.includes(mDay.dayNum) || disabledSpecificDates.includes(mDay.dateStr);
              const mApps = appointments.filter((a) => new Date(a.startsAt).toISOString().split('T')[0] === mDay.dateStr);
              const isSelected = mDay.dateStr === selectedDate;

              return (
                <div
                  key={mDay.dateStr}
                  onClick={() => setSelectedDate(mDay.dateStr)}
                  className={`h-24 p-2 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                      : isDisabled
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${isSelected ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {mDay.dayNumber}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSpecificDateAvailability(mDay.dateStr);
                      }}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDisabled ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                    >
                      {isDisabled ? 'Off' : 'On'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    {mApps.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-lg block truncate">
                        {mApps.length} cita(s)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEW / EDIT APPOINTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white">
                {editingAppointment ? 'Editar Cita Reservada' : 'Agendar Nueva Cita'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Nombre Cliente</label>
                  <input
                    type="text"
                    required
                    value={formClientFirstName}
                    onChange={(e) => setFormClientFirstName(e.target.value)}
                    placeholder="Pedro"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Apellido Cliente</label>
                  <input
                    type="text"
                    required
                    value={formClientLastName}
                    onChange={(e) => setFormClientLastName(e.target.value)}
                    placeholder="Pérez"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={formClientPhone}
                  onChange={(e) => setFormClientPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Servicio Solicitado</label>
                <select
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${s.price} CLP - {s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Fecha de Reserva</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Hora Inicio</label>
                  <input
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="11:00"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Hora Fin</label>
                  <input
                    type="text"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="12:00"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Detalles sobre el visagismo, corte o requerimientos especiales..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAppointment}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md"
                >
                  {isSavingAppointment ? 'Guardando...' : 'Guardar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT TECHNICAL PROFILE & CRM REASSIGN MODAL */}
      {isClientModalOpen && activeAppForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Gestión de Cliente & Ficha Técnica CRM
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Completa la ficha técnica o vincula esta cita al historial de un cliente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {techProfileMsg && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
                  techProfileMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                {techProfileMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{techProfileMsg.text}</span>
              </div>
            )}

            {/* Option 1: Search & Match Existing Client in CRM */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>1. Buscar & Vincular a Cliente Registrado</span>
                </h4>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 font-mono">
                  {allCrmClients.length} clientes en CRM
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Si este cliente ya existía en tu base de datos y deseas sumarle esta cita a su historial, búscalo por nombre o teléfono:
              </p>

              <input
                type="text"
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder="Escribe para buscar cliente por nombre o teléfono..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />

              {clientSearchQuery && (
                <div className="max-h-36 overflow-y-auto space-y-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  {allCrmClients
                    .filter(
                      (c) =>
                        c.firstName.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                        c.lastName.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                        c.phone.includes(clientSearchQuery)
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div>
                          <span className="font-bold text-white block">
                            {c.firstName} {c.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReassignClientToAppointment(c.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px]"
                        >
                          Vincular Cita
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Option 2: Edit / Create Client Details & Technical File */}
            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-white text-xs flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>2. Ficha Técnica & Registro del Cliente</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Nombre</label>
                  <input
                    type="text"
                    value={editClientFirstName}
                    onChange={(e) => setEditClientFirstName(e.target.value)}
                    placeholder="Francisco"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Apellido</label>
                  <input
                    type="text"
                    value={editClientLastName}
                    onChange={(e) => setEditClientLastName(e.target.value)}
                    placeholder="Pérez"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={editClientPhone}
                  onChange={(e) => setEditClientPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Anotaciones Técnicas (Visagismo, Fórmula de tinte, Observaciones)
                </label>
                <textarea
                  rows={3}
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Ej: Visagismo ovalado, degradado medio con máquina 1.5, fórmula de coloración 6.1..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveClientDetailsAndNotes}
                disabled={isSavingTechProfile}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingTechProfile ? 'Guardando en CRM...' : 'Guardar Cliente & Ficha Técnica en CRM'}</span>
              </button>
            </div>

            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
