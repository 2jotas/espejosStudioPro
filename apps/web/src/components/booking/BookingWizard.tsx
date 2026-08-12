import { useState, useEffect } from 'react';
import { Sparkles, Clock, DollarSign, ArrowLeft, ArrowRight, CheckCircle2, MapPin, Download, Check, ShieldCheck, Camera, FileText } from 'lucide-react';
import { ServiceItem } from '../admin/ServicesManager';

interface BookingWizardProps {
  slug: string;
  businessName: string;
  address?: string | null;
  phone?: string | null;
  services: ServiceItem[];
  onClose?: () => void;
}

export default function BookingWizard({ slug, businessName, address, services, onClose }: BookingWizardProps) {
  const [step, setStep] = useState(1); // 1 to 7

  // Form selections
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedSlot, setSelectedSlot] = useState<{ timeStr: string; startIso: string; endIso: string } | null>(null);

  // Client Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Optional details
  const [clientNote, setClientNote] = useState('');
  const [clientPhotoUrl, setClientPhotoUrl] = useState('');

  // Slots Loading
  const [availableSlots, setAvailableSlots] = useState<Array<{ timeStr: string; startIso: string; endIso: string }>>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedAppointmentId, setConfirmedAppointmentId] = useState<string | null>(null);

  // Generate next 14 days for date picker
  const datesList = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('es-CL', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('es-CL', { month: 'short' });
    return { isoDate, dayName, dayNum, monthName };
  });

  // Default select today
  useEffect(() => {
    if (!selectedDate && datesList.length > 0) {
      setSelectedDate(datesList[0].isoDate);
    }
  }, []);

  // Fetch slots when date or service changes
  useEffect(() => {
    if (!selectedDate || !selectedService) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await fetch(
          `/api/calendar/availability?slug=${encodeURIComponent(slug)}&date=${selectedDate}&durationMinutes=${selectedService.durationMinutes}`
        );
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots);
        } else {
          setAvailableSlots([]);
        }
      } catch {
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedService, slug]);

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedSlot || !firstName || !lastName || !phoneVal) {
      setErrorMsg('Faltan campos obligatorios para confirmar la reserva.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          serviceId: selectedService.id,
          startsAtIso: selectedSlot.startIso,
          firstName,
          lastName,
          phone: phoneVal,
          clientNote: clientNote || undefined,
          clientPhotoUrl: clientPhotoUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al procesar la reserva');

      setConfirmedAppointmentId(data.appointmentId);
      setStep(7); // Move to success step
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 7));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px]" />
      </div>

      {/* Header & Progress Bar */}
      <header className="relative z-10 max-w-3xl mx-auto w-full px-6 py-4 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center space-x-3">
          {step > 1 && step < 7 && (
            <button
              onClick={prevStep}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">{businessName}</span>
          </div>
        </div>

        {step < 7 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold">Paso {step} de 6</span>
            <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Content Container */}
      <main className="relative z-10 max-w-2xl mx-auto w-full px-6 py-8 flex-1 flex flex-col justify-center">

        {/* PASO 1 — BIENVENIDA */}
        {step === 1 && (
          <div className="text-center py-6 space-y-6">
            <div className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-2xl shadow-indigo-500/25">
              <div className="h-full w-full bg-slate-950 rounded-[22px] flex items-center justify-center font-extrabold text-white text-3xl">
                {businessName[0]}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-white mb-2">{businessName}</h1>
              {address && (
                <div className="flex items-center justify-center space-x-1.5 text-slate-400 text-sm">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>{address}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md max-w-md mx-auto text-left">
              <div className="flex items-center space-x-3 text-emerald-400 text-xs font-semibold mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Reserva Inmediata & Sincronizada</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Selecciona tu servicio y horario preferido en menos de 1 minuto. Cero esperas.
              </p>
            </div>

            <button
              onClick={nextStep}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Reservar Hora</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PASO 2 — SELECCIÓN DE SERVICIO */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Elige un Servicio</h2>
              <p className="text-slate-400 text-sm">Selecciona la atención que deseas agendar</p>
            </div>

            <div className="space-y-3">
              {services.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-white text-base mb-1">{service.name}</h3>
                      {service.description && (
                        <p className="text-slate-400 text-xs mb-3">{service.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs font-semibold">
                        <span className="flex items-center space-x-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{service.durationMinutes} min</span>
                        </span>
                        <span className="flex items-center space-x-1 text-emerald-400">
                          <DollarSign className="w-3.5 h-3.5 -mr-1" />
                          <span>${service.price.toLocaleString('es-CL')} CLP</span>
                        </span>
                      </div>
                    </div>

                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={nextStep}
              disabled={!selectedService}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-40 mt-6"
            >
              <span>Continuar a Fecha & Hora</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PASO 3 — SELECCIÓN DE DÍA Y HORA */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Selecciona Día y Hora</h2>
              <p className="text-slate-400 text-sm">
                Servicio: <strong className="text-white">{selectedService?.name}</strong> ({selectedService?.durationMinutes} min)
              </p>
            </div>

            {/* Horizontal Date Picker */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Fecha</label>
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {datesList.map((d) => {
                  const isSelected = selectedDate === d.isoDate;
                  return (
                    <button
                      key={d.isoDate}
                      onClick={() => setSelectedDate(d.isoDate)}
                      className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase">{d.dayName}</span>
                      <span className="block text-lg font-extrabold">{d.dayNum}</span>
                      <span className="block text-[10px] uppercase">{d.monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Horarios Disponibles</label>
              {isLoadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-11 bg-slate-900/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                  No hay horarios disponibles para esta fecha. Selecciona otro día.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.timeStr === slot.timeStr;
                    return (
                      <button
                        key={slot.timeStr}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-400 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {slot.timeStr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={nextStep}
              disabled={!selectedSlot}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-40 mt-6"
            >
              <span>Ingresar mis Datos</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PASO 4 — DATOS DEL CLIENTE */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Tus Datos de Contacto</h2>
              <p className="text-slate-400 text-sm">Necesarios para confirmar tu cita</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono Móvil (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  value={phoneVal}
                  onChange={(e) => setPhoneVal(e.target.value)}
                  placeholder="+56912345678"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer">
                  Guardar mis datos para agendar con 1 toque en mi próxima visita
                </label>
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!firstName.trim() || !lastName.trim() || !phoneVal.trim()}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PASO 5 — DETALLES OPCIONALES (SKIPPABLE) */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
                <span>Paso Opcional</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Indicaciones o Foto de Referencia</h2>
              <p className="text-slate-400 text-sm">Puedes agregar detalles sobre el corte o estilo que buscas</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Notas o Indicaciones Específicas</span>
                </label>
                <textarea
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  placeholder="Ej: Quiero un corte fade bajo #1 manteniendo el largo arriba..."
                  rows={3}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>URL de Foto de Referencia (Opcional)</span>
                </label>
                <input
                  type="url"
                  value={clientPhotoUrl}
                  onChange={(e) => setClientPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={nextStep}
                className="w-1/2 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-800 transition-colors"
              >
                Omitir
              </button>
              <button
                onClick={nextStep}
                className="w-1/2 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* PASO 6 — CONFIRMACIÓN */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Confirma tu Reserva</h2>
              <p className="text-slate-400 text-sm">Revisa el resumen antes de finalizar</p>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">
                {errorMsg}
              </div>
            )}

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl shadow-2xl">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Servicio</span>
                  <h3 className="text-lg font-bold text-white">{selectedService?.name}</h3>
                  <p className="text-xs text-slate-400">{selectedService?.durationMinutes} minutos</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Total</span>
                  <div className="text-lg font-extrabold text-emerald-400">
                    ${selectedService?.price.toLocaleString('es-CL')} CLP
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-slate-500 block">Fecha & Hora</span>
                  <span className="font-bold text-white text-sm">
                    {selectedDate} a las {selectedSlot?.timeStr} hrs
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Profesional</span>
                  <span className="font-bold text-white text-sm">{businessName}</span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-slate-500 block">Cliente</span>
                <span className="font-semibold text-slate-200">
                  {firstName} {lastName} ({phoneVal})
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Confirmando Reserva...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirmar Cita</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* PASO 7 — ÉXITO */}
        {step === 7 && (
          <div className="text-center py-8 space-y-6">
            <div className="h-20 w-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                ¡Reserva Confirmada!
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-3 mb-2">¡Nos vemos pronto, {firstName}!</h1>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Tu cita para <strong className="text-white">{selectedService?.name}</strong> quedó registrada para el{' '}
                <strong className="text-white">{selectedDate} a las {selectedSlot?.timeStr} hrs</strong>.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 max-w-md mx-auto space-y-3 text-left">
              <a
                href={`/api/appointments/${confirmedAppointmentId}/ics`}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Agregar a mi Calendario (.ics)</span>
              </a>

              {address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-700"
                >
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Ver en Google Maps</span>
                </a>
              )}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
              >
                Volver a la página principal
              </button>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
