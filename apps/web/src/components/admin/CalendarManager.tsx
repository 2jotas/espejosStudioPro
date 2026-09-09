import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, User, Phone, Sliders, Plus, Edit2, Trash2, CalendarDays, Grid, ListFilter, FileText, Check, MessageSquare, CheckCircle2, UserX, DoorClosed, Lock, Undo2 } from 'lucide-react';
import { ServiceItem } from './ServicesManager';
import TechnicalSheetModal from './TechnicalSheetModal';

export interface AppointmentItem {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'walk_in' | 'blocked' | 'held';
  source?: 'web' | 'whatsapp' | 'walk_in' | 'blocked' | 'google_calendar';
  whatsappStatus?: 'pendiente' | 'confirmada' | 'cancelada' | 'reagendada';
  whatsappReminderSentAt?: string | null;
  clientNote?: string;
  googleCalendarEventId?: string | null;
  client?: {
    id?: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  service?: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  } | null;
}

export type CalendarViewMode = 'day' | 'week' | 'month';

// Local date/time formatting helpers in Chile timezone (America/Santiago)
export const formatLocalDate = (d: Date | string): string => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });
};

export const formatLocalTime = (d: Date | string): string => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleTimeString('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const parseLocalDateTimeToIso = (dateStr: string, timeStr: string): string => {
  const dummy = new Date(`${dateStr}T${timeStr.trim()}:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(dummy);
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const santiagoDateStr = `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}Z`;
  const offsetMs = dummy.getTime() - new Date(santiagoDateStr).getTime();
  return new Date(dummy.getTime() + offsetMs).toISOString();
};

export default function CalendarManager() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(formatLocalDate(new Date()));
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Business Schedule State (Default: 10:00 - 20:00, Tuesday & Wednesday OFF)
  const [disabledDays, setDisabledDays] = useState<number[]>([2, 3]); // 2: Tuesday, 3: Wednesday
  const [disabledSpecificDates, setDisabledSpecificDates] = useState<string[]>([]); // YYYY-MM-DD override

  // Emergency Close Day & Undo Countdown State
  const [isClosingDay, setIsClosingDay] = useState(false);
  const [undoBlockId, setUndoBlockId] = useState<string | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(0);
  const countdownTimerRef = useRef<any>(null);

  // Walk-In / Block Slot Modal State
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInTab, setWalkInTab] = useState<'walk_in' | 'block'>('walk_in');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState('');
  const [walkInTime, setWalkInTime] = useState('12:00');
  const [walkInDuration, setWalkInDuration] = useState<number>(30);
  const [walkInNotes, setWalkInNotes] = useState('');
  const [blockReason, setBlockReason] = useState('Almuerzo / Trámite personal');
  const [isSavingWalkIn, setIsSavingWalkIn] = useState(false);

  // Technical Sheet Modal v1 for Fast Closing
  const [isTechSheetModalOpen, setIsTechSheetModalOpen] = useState(false);
  const [techSheetApp, setTechSheetApp] = useState<AppointmentItem | null>(null);

  const handleMarkAsDone = (app: AppointmentItem) => {
    setTechSheetApp(app);
    setIsTechSheetModalOpen(true);
  };

  const handleTechSheetSaved = async () => {
    if (techSheetApp) {
      await handleUpdateStatus(techSheetApp.id, 'completed');
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

  const handleSendWhatsAppReminder = async (app: AppointmentItem) => {
    if (!app.client?.phone) return;
    try {
      const res = await fetch(`/api/whatsapp/send-reminder/${app.id}`, { method: 'POST' });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((item) =>
            item.id === app.id ? { ...item, whatsappStatus: 'pendiente' } : item
          )
        );
        alert(`¡Recordatorio de WhatsApp enviado con éxito a ${app.client.firstName} (${app.client.phone})!`);
      } else {
        // Fallback: Open WhatsApp Web directly with prefilled reminder message
        const serviceName = app.service?.name || 'Corte de Autor';
        const timeStr = new Date(app.startsAt).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });
        const text = encodeURIComponent(`¡Hola ${app.client.firstName}! 👋 Te recordamos tu cita de *${serviceName}* hoy a las *${timeStr}* en Espejos Studio.\n\n¿Nos confirmas tu asistencia? 💈\n👉 Responde *'Confirmo'* o *'Cancelar'*.`);
        const cleanPhone = app.client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      }
    } catch (e) {
      console.error('Error enviando recordatorio:', e);
    }
  };

  const handleCloseRestOfDay = async () => {
    if (!confirm('¿Cerrar el resto del día de hoy? Ningún cliente podrá reservar por la web ni por WhatsApp hasta mañana a las 10:00.')) return;
    try {
      setIsClosingDay(true);
      const res = await fetch('/api/calendar/close-rest-of-day', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Error cerrando el día');
        return;
      }
      setUndoBlockId(data.blockId);
      setUndoCountdown(60);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setUndoCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            setUndoBlockId(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      await fetchAppointments();
    } catch (e: any) {
      alert(e.message || 'Error al cerrar el día');
    } finally {
      setIsClosingDay(false);
    }
  };

  const handleUndoCloseDay = async () => {
    if (!undoBlockId) return;
    try {
      const res = await fetch('/api/calendar/undo-close-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: undoBlockId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Error deshaciendo cierre');
        return;
      }
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setUndoBlockId(null);
      setUndoCountdown(0);
      await fetchAppointments();
      alert('✅ Agenda reabierta con éxito.');
    } catch (e: any) {
      alert(e.message || 'Error al deshacer cierre');
    }
  };

  const openWalkInModal = (defaultTime = '12:00') => {
    setWalkInTab('walk_in');
    setWalkInName('');
    setWalkInPhone('');
    setWalkInTime(defaultTime);
    setWalkInDuration(30);
    setWalkInNotes('');
    setBlockReason('Almuerzo / Trámite personal');
    if (services.length > 0 && !walkInServiceId) {
      setWalkInServiceId(services[0].id);
    }
    setIsWalkInModalOpen(true);
  };

  const handleSaveWalkInOrBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingWalkIn(true);
      const startsAtIso = parseLocalDateTimeToIso(selectedDate, walkInTime);

      if (walkInTab === 'walk_in') {
        const res = await fetch('/api/calendar/walk-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startsAtIso,
            durationMinutes: Number(walkInDuration),
            serviceId: walkInServiceId || undefined,
            fullName: walkInName.trim() || undefined,
            phone: walkInPhone.trim() || undefined,
            notes: walkInNotes.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || 'Error registrando Walk-in');
          return;
        }
        setIsWalkInModalOpen(false);
        await fetchAppointments();
      } else {
        const res = await fetch('/api/calendar/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startsAtIso,
            durationMinutes: Number(walkInDuration),
            reason: blockReason.trim() || 'Bloqueo manual',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || 'Error bloqueando slot');
          return;
        }
        setIsWalkInModalOpen(false);
        await fetchAppointments();
      }
    } catch (e: any) {
      alert(e.message || 'Error al guardar');
    } finally {
      setIsSavingWalkIn(false);
    }
  };

  const toggleSpecificDateAvailability = (dateStr: string) => {
    setDisabledSpecificDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() - (viewMode === 'week' ? 7 : 1));
    setSelectedDate(formatLocalDate(current));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + (viewMode === 'week' ? 7 : 1));
    setSelectedDate(formatLocalDate(current));
  };

  const handleToday = () => {
    setSelectedDate(formatLocalDate(new Date()));
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
    setFormClientFirstName(app.client?.firstName || '');
    setFormClientLastName(app.client?.lastName || '');
    setFormClientPhone(app.client?.phone || '');
    setFormServiceId(app.service?.id || (services[0]?.id || ''));

    const start = new Date(app.startsAt);
    const end = new Date(app.endsAt);
    setFormDate(formatLocalDate(start));
    setFormStartTime(formatLocalTime(start));
    setFormEndTime(formatLocalTime(end));
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
      const startsAtIso = parseLocalDateTimeToIso(formDate, formStartTime);
      const endsAtIso = parseLocalDateTimeToIso(formDate, formEndTime || formStartTime);

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
    const appDate = formatLocalDate(new Date(app.startsAt));
    return appDate === selectedDate;
  });

  const getRelativeDayLabel = (targetDateStr: string) => {
    const today = new Date();
    const todayStr = formatLocalDate(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatLocalDate(tomorrow);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowStr = formatLocalDate(dayAfterTomorrow);

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

  const formattedSelectedDate = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  })();

  // Calculate week dates (Monday to Sunday)
  const [sy, sm, sd] = selectedDate.split('-').map(Number);
  const currentSelectedObj = new Date(sy, sm - 1, sd);
  const currentDayOfWeek = currentSelectedObj.getDay(); // 0 is Sun
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sy, sm - 1, sd + mondayOffset + i);
    const dateStr = formatLocalDate(d);
    const dayNum = d.getDay();
    return {
      dateStr,
      dayNum,
      dayName: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayNum],
      formattedShort: `${d.getDate()}/${d.getMonth() + 1}`,
    };
  });

  // Calculate month days grid
  const year = currentSelectedObj.getFullYear();
  const month = currentSelectedObj.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonthOfWeek = new Date(year, month, 1).getDay();
  const monthPadOffset = firstDayOfMonthOfWeek === 0 ? 6 : firstDayOfMonthOfWeek - 1;

  const monthGridDays = Array.from({ length: daysInMonth + monthPadOffset }, (_, i) => {
    if (i < monthPadOffset) return null;
    const dayNumber = i - monthPadOffset + 1;
    const dObj = new Date(year, month, dayNumber);
    const dateStr = formatLocalDate(dObj);
    const dayNum = dObj.getDay();
    return {
      dateStr,
      dayNumber,
      dayNum,
    };
  });

  const getSourceBadge = (source?: string, status?: string) => {
    if (status === 'blocked' || source === 'blocked') return { label: '⛔ Bloqueo', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    if (status === 'walk_in' || source === 'walk_in') return { label: '💈 Walk-in', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (source === 'whatsapp') return { label: '💬 WhatsApp', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (source === 'google_calendar') return { label: '📅 Google', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
    return { label: '🌐 Web', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
  };

  return (
    <div className="space-y-6 text-left">
      {/* Undo Close Day Top Banner */}
      {undoCountdown > 0 && undoBlockId && (
        <div className="p-4 bg-rose-950/80 border-2 border-rose-500/60 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center space-x-3 text-rose-200">
            <DoorClosed className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold text-sm text-white">Resto del día cerrado exitosamente</div>
              <div className="text-xs text-rose-300">Ningún cliente podrá reservar hoy desde la web ni WhatsApp.</div>
            </div>
          </div>
          <button
            onClick={handleUndoCloseDay}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center space-x-1.5 transition-all shrink-0"
          >
            <Undo2 className="w-4 h-4" />
            <span>Deshacer ({undoCountdown}s)</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <span>Calendario de Reservas & Horarios</span>
          </h2>
          <p className="text-slate-400 text-sm">Gestiona tus citas, registra walk-ins al instante y cierra el día en 1 toque</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Walk-in / Bloquear */}
          <button
            onClick={() => openWalkInModal('12:00')}
            className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>💈 Walk-in / Bloquear</span>
          </button>

          {/* 2. Cerrar el resto del día */}
          <button
            onClick={handleCloseRestOfDay}
            disabled={isClosingDay}
            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
            title="Cierra todas las horas restantes de hoy"
          >
            <DoorClosed className="w-4 h-4" />
            <span>Cerrar resto del día</span>
          </button>

          {/* 3. Regular New Appointment */}
          <button
            onClick={() => openNewModal('11:00')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>

          {/* 4. Sync Google Calendar */}
          <button
            onClick={handleSyncGoogleEvents}
            disabled={isSyncingGoogle}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
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
          <span>Configuración de Horario Semanal (10:00 AM - 20:00 PM · Mar y Mié Cerrado Fijo)</span>
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
                  Las citas agendadas por tus clientes en /john, por WhatsApp o sincronizadas de Google Calendar aparecerán aquí.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => openWalkInModal('12:00')}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs rounded-xl shadow-md inline-flex items-center space-x-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>💈 Walk-in / Bloquear</span>
                </button>
                <button
                  onClick={() => openNewModal('11:00')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar cita</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {dayAppointments.map((app) => {
                const start = new Date(app.startsAt);
                const end = new Date(app.endsAt);
                const timeStr = `${start.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit' })}`;
                const sourceBadge = getSourceBadge(app.source, app.status);

                const clientName = app.client
                  ? `${app.client.firstName} ${app.client.lastName}`
                  : (app.status === 'blocked' ? (app.clientNote || 'Horario Bloqueado') : 'Cliente Walk-in');

                return (
                  <div
                    key={app.id}
                    className={`border rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl transition-colors ${
                      app.status === 'blocked'
                        ? 'bg-slate-950/90 border-slate-800 opacity-80'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 ${
                        app.status === 'blocked'
                          ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                          : app.status === 'walk_in'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      }`}>
                        {app.status === 'blocked' ? <Lock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-white text-sm">
                            {clientName}
                          </h4>

                          {/* Source Badge (Web, WhatsApp, Walk-in, Bloqueo, Google) */}
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${sourceBadge.color}`}>
                            {sourceBadge.label}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                              (app.status === 'cancelled' || app.whatsappStatus === 'cancelada')
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : (app.whatsappStatus === 'confirmada' || (app.status === 'confirmed' && app.whatsappStatus !== 'reagendada'))
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : (app.whatsappStatus === 'reagendada')
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : app.status === 'completed'
                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                : app.status === 'walk_in'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : app.status === 'blocked'
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {(app.status === 'cancelled' || app.whatsappStatus === 'cancelada')
                              ? '🔴 Cancelada'
                              : (app.whatsappStatus === 'confirmada' || (app.status === 'confirmed' && app.whatsappStatus !== 'reagendada'))
                              ? '🟢 Confirmada'
                              : (app.whatsappStatus === 'reagendada')
                              ? '🟡 Reagendada'
                              : app.status === 'completed'
                              ? '🔵 Completada'
                              : app.status === 'walk_in'
                              ? '💈 En Local'
                              : app.status === 'blocked'
                              ? '⛔ Bloqueado'
                              : '🟣 Pendiente'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center space-x-1 text-indigo-300 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeStr}</span>
                          </span>
                          {app.service && (
                            <span>Servicio: <strong className="text-slate-200">{app.service.name}</strong> (${app.service.price} CLP)</span>
                          )}
                          {app.client?.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{app.client.phone}</span>
                            </span>
                          )}
                        </div>

                        {app.clientNote && (
                          <p className="text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 w-fit">
                            Nota: "{app.clientNote}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* 1. WhatsApp (if client phone exists) */}
                      {app.client?.phone && (
                        <button
                          onClick={() => handleSendWhatsAppReminder(app)}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1"
                          title="Enviar mensaje de WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      )}

                      {/* 2. Llegó (Confirmar llegada) */}
                      {app.status !== 'confirmed' && app.status !== 'completed' && app.status !== 'blocked' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                          disabled={updatingId === app.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Llegó</span>
                        </button>
                      )}

                      {/* 3. Listo (Cerrar cita con Ficha Técnica) */}
                      {app.status !== 'completed' && app.status !== 'blocked' && (
                        <button
                          onClick={() => handleMarkAsDone(app)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Listo</span>
                        </button>
                      )}

                      {/* 4. No-Show */}
                      {app.status !== 'completed' && app.status !== 'cancelled' && app.status !== 'blocked' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                          disabled={updatingId === app.id}
                          className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1"
                          title="Marcar como No-Show / Inasistencia"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">No-show</span>
                        </button>
                      )}

                      {/* 5. Reagendar / Editar */}
                      {app.status !== 'blocked' && (
                        <button
                          onClick={() => openEditModal(app)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
                          title="Reagendar cita"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reagendar</span>
                        </button>
                      )}

                      {/* 6. Ficha Técnica CRM */}
                      {app.client?.id && (
                        <button
                          onClick={() => {
                            setTechSheetApp(app);
                            setIsTechSheetModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 rounded-xl transition-colors"
                          title="Ver / Editar Ficha Técnica"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteAppointment(app.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl transition-colors"
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
              const dayApps = appointments.filter((a) => formatLocalDate(new Date(a.startsAt)) === wDay.dateStr);

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
                          {app.client ? `${app.client.firstName} ${app.client.lastName}` : (app.status === 'blocked' ? 'Bloqueo' : 'Walk-in')}
                        </div>
                        <div className="text-[10px] text-indigo-300 font-mono">
                          {new Date(app.startsAt).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setSelectedDate(wDay.dateStr);
                        openWalkInModal('12:00');
                      }}
                      className="w-full py-1.5 border border-dashed border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 text-[10px] font-semibold rounded-xl transition-colors"
                    >
                      + Walk-in / Bloquear
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
              const mApps = appointments.filter((a) => formatLocalDate(new Date(a.startsAt)) === mDay.dateStr);
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

      {/* MODAL: WALK-IN / BLOQUEO RÁPIDO (2 TAPS) */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bloqueo Rápido / Walk-in</h3>
                  <p className="text-[11px] text-slate-400">Evita que la web o el bot vendan este horario</p>
                </div>
              </div>
              <button onClick={() => setIsWalkInModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Sub-tabs: Walk-in vs Bloqueo */}
            <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setWalkInTab('walk_in')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  walkInTab === 'walk_in' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                💈 Walk-in en Local
              </button>
              <button
                type="button"
                onClick={() => setWalkInTab('block')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  walkInTab === 'block' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⛔ Bloqueo Manual
              </button>
            </div>

            <form onSubmit={handleSaveWalkInOrBlock} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={walkInTime}
                    onChange={(e) => setWalkInTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Duración</label>
                  <select
                    value={walkInDuration}
                    onChange={(e) => setWalkInDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={90}>90 minutos (1.5 horas)</option>
                    <option value={120}>120 minutos (2 horas)</option>
                  </select>
                </div>
              </div>

              {walkInTab === 'walk_in' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">Nombre (Opcional)</label>
                      <input
                        type="text"
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="Ej: Marcelo Rojas"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">Teléfono (Opcional)</label>
                      <input
                        type="tel"
                        value={walkInPhone}
                        onChange={(e) => setWalkInPhone(e.target.value)}
                        placeholder="+56 9 1234 5678"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">Servicio</label>
                    <select
                      value={walkInServiceId}
                      onChange={(e) => setWalkInServiceId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (${s.price} CLP)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">Nota o detalle</label>
                    <input
                      type="text"
                      value={walkInNotes}
                      onChange={(e) => setWalkInNotes(e.target.value)}
                      placeholder="Ej: Vino sin hora, degradado medio"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Motivo del Bloqueo</label>
                  <input
                    type="text"
                    required
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ej: Almuerzo, Trámite personal, Mantención"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingWalkIn}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {isSavingWalkIn ? 'Guardando...' : walkInTab === 'walk_in' ? 'Registrar Walk-in' : 'Bloquear Horario'}
                </button>
              </div>
            </form>
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
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
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
                    type="time"
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
                    type="time"
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

      {/* Modal Ficha Técnica Estructurada v1 */}
      {isTechSheetModalOpen && techSheetApp && techSheetApp.client?.id && (
        <TechnicalSheetModal
          clientId={techSheetApp.client.id}
          clientName={`${techSheetApp.client.firstName} ${techSheetApp.client.lastName}`}
          clientPhone={techSheetApp.client.phone}
          onClose={() => setIsTechSheetModalOpen(false)}
          onSaved={handleTechSheetSaved}
          isMandatoryToClose={techSheetApp.status !== 'completed'}
        />
      )}
    </div>
  );
}
