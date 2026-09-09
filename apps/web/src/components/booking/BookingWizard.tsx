import { useState, useEffect } from 'react';
import { Clock, ArrowLeft, CheckCircle2, Check, MessageSquare } from 'lucide-react';
import { ServiceItem } from '../admin/ServicesManager';

interface BookingWizardProps {
  slug: string;
  businessName: string;
  address?: string | null;
  phone?: string | null;
  services: ServiceItem[];
  onClose?: () => void;
}

export default function BookingWizard({ slug, businessName, address, phone, services, onClose }: BookingWizardProps) {
  const [step, setStep] = useState(1); // 1: Servicio, 2: Día y Hora, 3: Datos, 4: Confirmar, 5: Éxito

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedSlot, setSelectedSlot] = useState<{ timeStr: string; startIso: string; endIso: string } | null>(null);

  // Client Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneVal, setPhoneVal] = useState('+56 9 ');
  const [acceptSheetConsent, setAcceptSheetConsent] = useState(true);

  // Slots Loading
  const [availableSlots, setAvailableSlots] = useState<Array<{ timeStr: string; startIso: string; endIso: string }>>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<{
    id: string;
    startsAt: string;
    serviceName: string;
    duration: number;
    price: number;
  } | null>(null);

  // Precargar datos de cliente si existen en localStorage
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('espejos_client_phone');
      const savedFirst = localStorage.getItem('espejos_client_first');
      const savedLast = localStorage.getItem('espejos_client_last');
      if (savedPhone) setPhoneVal(savedPhone);
      if (savedFirst) setFirstName(savedFirst);
      if (savedLast) setLastName(savedLast);
    } catch {}
  }, []);

  // Generar próximos 14 días para selección rápida
  const datesList = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('es-CL', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('es-CL', { month: 'short' });
    return { isoDate, dayName, dayNum, monthName };
  });

  useEffect(() => {
    if (!selectedDate && datesList.length > 0) {
      setSelectedDate(datesList[0].isoDate);
    }
  }, []);

  // Fetch slots cuando cambia fecha o servicio
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
          setAvailableSlots(data.slots || []);
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+56 9')) {
      val = '+56 9 ' + val.replace(/\D/g, '').slice(0, 8);
    }
    setPhoneVal(val);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedSlot || !firstName.trim() || !lastName.trim() || !phoneVal.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const cleanPhone = phoneVal.replace(/\D/g, '');
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          serviceId: selectedService.id,
          startsAtIso: selectedSlot.startIso,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: cleanPhone,
          acceptSheetConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al procesar la reserva');

      // Guardar en localStorage para visitas futuras
      try {
        localStorage.setItem('espejos_client_phone', phoneVal);
        localStorage.setItem('espejos_client_first', firstName.trim());
        localStorage.setItem('espejos_client_last', lastName.trim());
      } catch {}

      setConfirmedAppointment({
        id: data.appointmentId || data.id,
        startsAt: selectedSlot.startIso,
        serviceName: selectedService.name,
        duration: selectedService.durationMinutes,
        price: selectedService.price,
      });

      setStep(5); // Paso Éxito
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al confirmar la cita');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDateHeader = selectedSlot
    ? new Date(selectedSlot.startIso).toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl text-slate-100 flex flex-col justify-between overflow-y-auto selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Header & Steps Indicator */}
      <header className="relative z-10 max-w-xl mx-auto w-full px-4 py-4 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center space-x-2">
          {step > 1 && step < 5 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800"
            >
              Cerrar
            </button>
          )}
          <span className="font-bold text-white text-sm truncate">{businessName}</span>
        </div>

        {step < 5 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold">Paso {step} de 4</span>
            <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-xl mx-auto w-full px-4 py-6 flex-1 flex flex-col justify-center">

        {/* PASO 1: SELECCIONAR SERVICIO */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-left">
              <h2 className="text-xl font-bold text-white">1. Elige tu servicio</h2>
              <p className="text-xs text-slate-400">Atención personalizada y a tiempo en Antofagasta.</p>
            </div>

            <div className="space-y-2.5">
              {services.map((s) => {
                const isSelected = selectedService?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedService(s);
                      setStep(2);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 text-white'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-sm text-white">{s.name}</h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{s.durationMinutes} min</span>
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-200">${s.price.toLocaleString('es-CL')} CLP</span>
                      </div>
                      {s.description && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.description}</p>
                      )}
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
                        →
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PASO 2: SELECCIONAR DÍA Y HORA */}
        {step === 2 && selectedService && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">2. Selecciona día y hora</h2>
              <p className="text-xs text-slate-400">
                {selectedService.name} ({selectedService.durationMinutes} min)
              </p>
            </div>

            {/* Carrusel horizontal de días */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {datesList.map((d) => {
                const isSelected = selectedDate === d.isoDate;
                return (
                  <button
                    key={d.isoDate}
                    onClick={() => setSelectedDate(d.isoDate)}
                    className={`flex-shrink-0 w-16 py-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-[10px] font-semibold uppercase">{d.dayName}</span>
                    <span className="block text-base font-bold my-0.5">{d.dayNum}</span>
                    <span className="block text-[10px] opacity-80">{d.monthName}</span>
                  </button>
                );
              })}
            </div>

            {/* Grid de Horarios Disponibles */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-h-[180px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Horas Disponibles
              </span>

              {isLoadingSlots ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No hay horas disponibles para este día. Por favor selecciona otra fecha.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.startIso === slot.startIso;
                    return (
                      <button
                        key={slot.startIso}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep(3);
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-200'
                        }`}
                      >
                        {slot.timeStr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 3: DATOS DEL CLIENTE */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">3. Tus datos de contacto</h2>
              <p className="text-xs text-slate-400">Te confirmaremos y recordaremos tu cita por WhatsApp.</p>
            </div>

            <div className="space-y-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej: Carlos"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej: Silva"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp (Chile) *</label>
                <input
                  type="tel"
                  required
                  value={phoneVal}
                  onChange={handlePhoneChange}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Enviaremos recordatorio 1-2 horas antes para que confirmes tu llegada.
                </span>
              </div>
            </div>

            <button
              disabled={!firstName.trim() || !lastName.trim() || phoneVal.replace(/\D/g, '').length < 9}
              onClick={() => setStep(4)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-colors"
            >
              Continuar al Resumen →
            </button>
          </div>
        )}

        {/* PASO 4: CONFIRMAR */}
        {step === 4 && selectedService && selectedSlot && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">4. Confirma tu cita</h2>
              <p className="text-xs text-slate-400">Revisa los datos antes de agendar.</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 text-left">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Servicio
                </span>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-base">{selectedService.name}</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    ${selectedService.price.toLocaleString('es-CL')} CLP
                  </span>
                </div>
                <span className="text-xs text-slate-400">{selectedService.durationMinutes} minutos</span>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Fecha y Hora
                </span>
                <span className="font-bold text-white text-sm capitalize">{formattedDateHeader}</span>
                <span className="text-xs text-slate-400 block">Antofagasta (America/Santiago)</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Cliente
                </span>
                <span className="font-semibold text-white text-sm block">
                  {firstName} {lastName}
                </span>
                <span className="text-xs text-slate-400 font-mono">{phoneVal}</span>
              </div>
            </div>

            {/* Checkbox de Ficha Técnica Consent */}
            <label className="flex items-start space-x-2.5 text-left text-xs text-slate-400 cursor-pointer p-2 bg-slate-900/40 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={acceptSheetConsent}
                onChange={(e) => setAcceptSheetConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Acepto que guardes mi ficha técnica de corte para agilizar mis próximas visitas.</span>
            </label>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-left">
                {errorMsg}
              </div>
            )}

            <button
              disabled={isSubmitting}
              onClick={handleConfirmBooking}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Agendando cita...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Confirmar y Reservar Hora</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* PASO 5: ÉXITO */}
        {step === 5 && confirmedAppointment && (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">¡Hora Agendada con Éxito!</h2>
              <p className="text-xs text-slate-300 mt-1">
                Te esperamos en <strong>{businessName}</strong>.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-sm mx-auto">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Servicio:</span>
                <span className="font-bold text-white">{confirmedAppointment.serviceName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Fecha y Hora:</span>
                <span className="font-bold text-white capitalize">{formattedDateHeader}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Lugar:</span>
                <span className="font-semibold text-white">{address || 'Antofagasta'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total a pagar en el local:</span>
                <span className="font-bold text-emerald-400">${confirmedAppointment.price.toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              📱 Te hemos registrado en el sistema y te escribiremos a tu WhatsApp (<strong>{phoneVal}</strong>) para confirmar tu llegada.
            </p>

            <div className="space-y-2 max-w-xs mx-auto pt-2">
              {phone && (
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, '')}?text=Hola%20John,%20acabo%20de%20agendar%20mi%20hora%20para%20${encodeURIComponent(confirmedAppointment.serviceName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Abrir Chat con John</span>
                </a>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Volver al Espacio
              </button>
            </div>
          </div>
        )}

      </main>

      <footer className="relative z-10 py-3 text-center text-[11px] text-slate-600 border-t border-slate-900">
        Espejos Studio · Antofagasta
      </footer>
    </div>
  );
}
