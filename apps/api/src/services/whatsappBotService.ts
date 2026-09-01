import { PrismaClient } from '@prisma/client';
import {
  fetchGoogleBusyRanges,
  fetchGoogleBusyRangesViaApiKey,
  calculateAvailableTimeSlots,
  createGoogleCalendarEvent,
  BusyRange
} from '../lib/googleCalendar.js';

const prisma = new PrismaClient();

export interface WhatsAppIncomingMessage {
  fromPhone: string;
  senderName?: string;
  messageText: string;
  professionalId: string;
}

export interface BotClassificationResult {
  intent: 'PERSONAL' | 'CONFIRMATION' | 'CANCELLATION' | 'RESCHEDULE' | 'BOOKING_INQUIRY' | 'GENERAL_QUESTION' | 'RATE_LIMITED';
  appointmentId?: string;
  responseMessage?: string;
  shouldIgnore: boolean;
}

export interface OfferedSlot {
  index: number;
  startIso: string;
  endIso: string;
  dateStr: string;
  timeLabel: string;
  dayLabel: string;
  formattedChoice: string;
}

export interface BotConversationState {
  step: 'IDLE' | 'AWAITING_NAME' | 'AWAITING_SERVICE' | 'AWAITING_SLOT';
  clientName?: string;
  clientId?: string;
  selectedServiceId?: string;
  offeredSlots?: OfferedSlot[];
  isRescheduling?: boolean;
  rescheduleAppointmentId?: string;
  lastInteractionTime: number;
  messageTimestamps: number[];
}

// In-memory conversation state store per (professionalId + phone)
const conversationStates = new Map<string, BotConversationState>();

/**
 * Normalizes phone numbers (e.g. +56912345678, 56912345678, 912345678)
 */
export function normalizePhone(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('569') && cleaned.length === 11) {
    return cleaned;
  }
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    return `56${cleaned}`;
  }
  if (cleaned.startsWith('56') && cleaned.length === 11) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Gets or initializes conversation state with 10-minute TTL and rate-limiting
 */
function getConversationState(professionalId: string, phone: string): BotConversationState {
  const key = `${professionalId}_${phone}`;
  const now = Date.now();
  let state = conversationStates.get(key);

  if (!state || (now - state.lastInteractionTime > 10 * 60 * 1000)) {
    state = {
      step: 'IDLE',
      lastInteractionTime: now,
      messageTimestamps: []
    };
    conversationStates.set(key, state);
  }

  state.lastInteractionTime = now;
  state.messageTimestamps.push(now);
  state.messageTimestamps = state.messageTimestamps.filter(t => now - t < 60000);

  return state;
}

/**
 * Calculates top 4-5 available slots across today and upcoming working days
 */
export async function getTopAvailableSlotsForBot(
  professional: any,
  durationMinutes = 30
): Promise<OfferedSlot[]> {
  const offeredSlots: OfferedSlot[] = [];
  const now = new Date();

  // Determine dates for today, tomorrow, and day after tomorrow in America/Santiago
  const dateOptions: Date[] = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dateOptions.push(d);
  }

  const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' });
  const dayNameFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', timeZone: 'America/Santiago' });

  for (const dateObj of dateOptions) {
    if (offeredSlots.length >= 4) break;

    const dateStr = formatter.format(dateObj); // YYYY-MM-DD
    const isToday = formatter.format(now) === dateStr;
    const tomorrowObj = new Date();
    tomorrowObj.setDate(now.getDate() + 1);
    const isTomorrow = formatter.format(tomorrowObj) === dateStr;

    let dayLabel = isToday ? 'Hoy' : isTomorrow ? 'Mañana' : capitalize(dayNameFormatter.format(dateObj));

    // Calculate busy ranges for this date
    const windowStart = new Date(`${dateStr}T00:00:00.000Z`);
    windowStart.setUTCDate(windowStart.getUTCDate() - 1);
    const windowEnd = new Date(`${dateStr}T23:59:59.999Z`);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);

    const dbAppointments = await prisma.appointment.findMany({
      where: {
        professionalId: professional.id,
        status: { in: ['pending', 'confirmed'] },
        startsAt: { lte: windowEnd },
        endsAt: { gte: windowStart },
      },
    });

    const busyRanges: BusyRange[] = dbAppointments.map((app) => ({
      start: app.startsAt,
      end: app.endsAt,
    }));

    const dayStartIso = `${dateStr}T00:00:00.000Z`;
    const dayEndIso = `${dateStr}T23:59:59.999Z`;

    if (professional.googleCalendarConnected && professional.googleRefreshToken) {
      const googleBusy = await fetchGoogleBusyRanges(
        professional.googleRefreshToken,
        dayStartIso,
        dayEndIso
      );
      busyRanges.push(...googleBusy);
    } else if (professional.googleCalendarConnected && professional.googleApiKey && professional.googleCalendarId) {
      const googleBusy = await fetchGoogleBusyRangesViaApiKey(
        professional.googleCalendarId,
        professional.googleApiKey,
        dayStartIso,
        dayEndIso
      );
      busyRanges.push(...googleBusy);
    }

    const rawSlots = calculateAvailableTimeSlots({
      dateStr,
      durationMinutes,
      busyRanges,
    });

    // Filter out slots in the past or within 30 minutes from right now
    const bufferTime = now.getTime() + 30 * 60 * 1000;
    const validSlots = rawSlots.filter((slot) => {
      const slotTime = new Date(slot.startIso).getTime();
      return slotTime > bufferTime;
    });

    for (const slot of validSlots) {
      if (offeredSlots.length >= 4) break;
      const index = offeredSlots.length + 1;
      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
      const emoji = emojis[index - 1] || `${index}.`;

      offeredSlots.push({
        index,
        startIso: slot.startIso,
        endIso: slot.endIso,
        dateStr,
        timeLabel: `${slot.timeStr} hrs`,
        dayLabel,
        formattedChoice: `${emoji} *${dayLabel}* a las *${slot.timeStr} hrs*`
      });
    }
  }

  return offeredSlots;
}

/**
 * Main entry point: Classifies and processes incoming WhatsApp messages with state machine
 */
export async function classifyAndProcessMessage(
  msg: WhatsAppIncomingMessage
): Promise<BotClassificationResult> {
  const cleanPhone = normalizePhone(msg.fromPhone);
  const text = msg.messageText.trim();
  const lowerText = text.toLowerCase();

  // 1. Fetch professional and bot configuration
  const professional = await prisma.professional.findUnique({
    where: { id: msg.professionalId },
    include: {
      services: { where: { active: true }, orderBy: { order: 'asc' } },
    }
  });

  if (!professional || !professional.whatsappBotEnabled) {
    return { intent: 'PERSONAL', shouldIgnore: true };
  }

  // 2. Anti-Spam Rate Limiter (Max 5 msgs / min)
  const state = getConversationState(professional.id, cleanPhone);
  if (state.messageTimestamps.length > 5) {
    const reply = `⏳ Has enviado varios mensajes seguidos. Por favor espera un momento para que pueda atenderte correctamente.`;
    return {
      intent: 'RATE_LIMITED',
      responseMessage: reply,
      shouldIgnore: false
    };
  }

  // Log incoming message to DB
  await prisma.whatsAppMessageLog.create({
    data: {
      professionalId: professional.id,
      phone: cleanPhone,
      role: 'user',
      content: msg.messageText
    }
  });

  // 3. Fetch existing client and recent appointments
  const client = await prisma.client.findFirst({
    where: {
      professionalId: professional.id,
      phone: { contains: cleanPhone.slice(-8) }
    },
    include: {
      profile: true,
      appointments: {
        where: {
          startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h or future
          status: { in: ['pending', 'confirmed'] }
        },
        orderBy: { startsAt: 'asc' },
        include: { service: true }
      }
    }
  });

  const nextAppointment = client?.appointments[0];

  // 4. Fast Affirmative / Negative / Reschedule Intent Check for Existing Active Appointments
  const isAffirmative = /^(si|sí|confirmo|voy|confirmado|allá nos vemos|oka|ok|de acuerdo|dale|voy para allá|listo)$/i.test(lowerText) ||
    lowerText.includes('confirmo') || lowerText.includes('si voy') || lowerText.includes('sí voy') || lowerText.includes('alla nos vemos');

  const isNegative = /^(no|cancela|cancelar|no puedo|no voy a poder|me surgió|me complico|anular)$/i.test(lowerText) ||
    lowerText.includes('no podre') || lowerText.includes('no podré') || lowerText.includes('cancela') || lowerText.includes('no voy');

  const isReschedule = lowerText.includes('mover') || lowerText.includes('cambiar hora') || lowerText.includes('reagendar') || lowerText.includes('otra hora') || lowerText.includes('mas tarde') || lowerText.includes('más tarde');

  // A. CONFIRMATION HANDLING (🟢 Verde)
  if (isAffirmative && nextAppointment && state.step === 'IDLE') {
    await prisma.appointment.update({
      where: { id: nextAppointment.id },
      data: {
        status: 'confirmed',
        whatsappStatus: 'confirmada'
      }
    });

    const clientName = client?.firstName || msg.senderName || 'estimado';
    const timeStr = new Date(nextAppointment.startsAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const reply = `¡Excelente, ${clientName}! 💈 Tu cita de *${nextAppointment.service.name}* para hoy a las *${timeStr} hrs* quedó confirmada al 100%. Te esperamos en ${professional.address || professional.businessName}. ¡Nos vemos pronto! ✨`;

    await logAssistantReply(professional.id, cleanPhone, reply);
    return {
      intent: 'CONFIRMATION',
      appointmentId: nextAppointment.id,
      responseMessage: reply,
      shouldIgnore: false
    };
  }

  // B. CANCELLATION HANDLING (🔴 Rojo)
  if (isNegative && nextAppointment && state.step === 'IDLE') {
    await prisma.appointment.update({
      where: { id: nextAppointment.id },
      data: {
        status: 'cancelled',
        whatsappStatus: 'cancelada'
      }
    });

    const clientName = client?.firstName || msg.senderName || 'estimado';
    const reply = `Entendido, ${clientName}. He cancelado tu cita y liberado el horario 💈. Cuando gustes volver a agendar, puedes escribirnos por aquí o en https://espejosstudio.cl/${professional.slug}. ¡Que tengas un excelente día!`;

    await logAssistantReply(professional.id, cleanPhone, reply);
    return {
      intent: 'CANCELLATION',
      appointmentId: nextAppointment.id,
      responseMessage: reply,
      shouldIgnore: false
    };
  }

  // C. RESCHEDULE HANDLING (🟡 Amarillo)
  if (isReschedule && nextAppointment && state.step === 'IDLE') {
    await prisma.appointment.update({
      where: { id: nextAppointment.id },
      data: { whatsappStatus: 'reagendada' }
    });

    const slots = await getTopAvailableSlotsForBot(professional, nextAppointment.service.durationMinutes || 30);

    if (slots.length > 0) {
      state.step = 'AWAITING_SLOT';
      state.clientId = client?.id;
      state.selectedServiceId = nextAppointment.serviceId;
      state.offeredSlots = slots;
      state.isRescheduling = true;
      state.rescheduleAppointmentId = nextAppointment.id;

      const slotsMenu = slots.map(s => s.formattedChoice).join('\n');
      const reply = `¡Sin problema! Vamos a reagendar tu cita 💈.\n\nEstos son los próximos horarios disponibles con *${professional.businessName}*:\n\n${slotsMenu}\n5️⃣ 🌐 *Ver otro día / calendario completo*\n\n👉 *Responde con el número de tu opción (ej: 1 o 2).*`;

      await logAssistantReply(professional.id, cleanPhone, reply);
      return {
        intent: 'RESCHEDULE',
        appointmentId: nextAppointment.id,
        responseMessage: reply,
        shouldIgnore: false
      };
    }
  }

  // 5. STATE MACHINE EXECUTION

  // STEP: AWAITING_NAME (New Client onboarding)
  if (state.step === 'AWAITING_NAME') {
    const extractedName = extractClientName(text);
    if (!extractedName) {
      const reply = `Por favor, indícanos tu nombre y apellido para poder reservar tu turno 💈. (Ej: *Carlos Gómez*)`;
      await logAssistantReply(professional.id, cleanPhone, reply);
      return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
    }

    const { firstName, lastName } = splitName(extractedName);

    // Create client in DB
    const newClient = await prisma.client.create({
      data: {
        professionalId: professional.id,
        phone: cleanPhone,
        firstName,
        lastName: lastName || ''
      }
    });

    await prisma.clientProfile.create({
      data: {
        clientId: newClient.id,
        professionalId: professional.id,
        tags: '["whatsapp_bot"]'
      }
    });

    state.clientId = newClient.id;
    state.clientName = firstName;

    // Calculate slots for primary service
    const primaryService = professional.services[0];
    const duration = primaryService?.durationMinutes || 30;
    const slots = await getTopAvailableSlotsForBot(professional, duration);

    if (slots.length > 0) {
      state.step = 'AWAITING_SLOT';
      state.selectedServiceId = primaryService?.id;
      state.offeredSlots = slots;

      const slotsMenu = slots.map(s => s.formattedChoice).join('\n');
      const reply = `¡Mucho gusto, *${firstName}*! 👋 Bienvenido a *${professional.businessName}* 💈.\n\nTenemos estos horarios disponibles para tu corte:\n\n${slotsMenu}\n5️⃣ 🌐 *Ver otro día / calendario completo*\n\n👉 *Responde con el número de tu opción preferida (ej: 1).*`;

      await logAssistantReply(professional.id, cleanPhone, reply);
      return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
    } else {
      state.step = 'IDLE';
      const reply = `¡Mucho gusto, *${firstName}*! Por ahora no nos quedan cupos disponibles para hoy ni mañana. Puedes revisar los próximos días aquí: https://espejosstudio.cl/${professional.slug} 💈`;
      await logAssistantReply(professional.id, cleanPhone, reply);
      return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
    }
  }

  // STEP: AWAITING_SLOT (User chooses 1, 2, 3, 4, or 5)
  if (state.step === 'AWAITING_SLOT' && state.offeredSlots && state.offeredSlots.length > 0) {
    const choiceNum = parseChoiceNumber(lowerText);

    if (choiceNum === 5 || lowerText.includes('otro') || lowerText.includes('ver mas') || lowerText.includes('ver más') || lowerText.includes('calendario')) {
      state.step = 'IDLE';
      const reply = `Puedes ver todos los días y horarios libres de nuestro calendario interactivo aquí: https://espejosstudio.cl/${professional.slug} 💈 ¡Te esperamos!`;
      await logAssistantReply(professional.id, cleanPhone, reply);
      return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
    }

    if (choiceNum && choiceNum >= 1 && choiceNum <= state.offeredSlots.length) {
      const chosenSlot = state.offeredSlots[choiceNum - 1];
      const targetClient = client || (state.clientId ? await prisma.client.findUnique({ where: { id: state.clientId } }) : null);

      if (!targetClient) {
        state.step = 'AWAITING_NAME';
        const reply = `Para confirmar tu cita a las *${chosenSlot.timeLabel}*, ¿cuál es tu nombre y apellido? 💈`;
        await logAssistantReply(professional.id, cleanPhone, reply);
        return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
      }

      // Check slot availability atomically
      const slotStart = new Date(chosenSlot.startIso);
      const slotEnd = new Date(chosenSlot.endIso);

      const conflict = await prisma.appointment.findFirst({
        where: {
          professionalId: professional.id,
          status: { in: ['pending', 'confirmed'] },
          startsAt: { lt: slotEnd },
          endsAt: { gt: slotStart }
        }
      });

      if (conflict) {
        // Slot taken in the meantime -> recalculate
        const freshSlots = await getTopAvailableSlotsForBot(professional, 30);
        state.offeredSlots = freshSlots;
        const slotsMenu = freshSlots.map(s => s.formattedChoice).join('\n');
        const reply = `⚠️ El horario de las *${chosenSlot.timeLabel}* acaba de ser reservado. Tengo estas nuevas opciones disponibles para ti:\n\n${slotsMenu}\n5️⃣ 🌐 *Ver otro día*\n\n👉 *Elige una opción (ej: 1):*`;
        await logAssistantReply(professional.id, cleanPhone, reply);
        return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
      }

      // If rescheduling, cancel previous appointment
      if (state.isRescheduling && state.rescheduleAppointmentId) {
        await prisma.appointment.update({
          where: { id: state.rescheduleAppointmentId },
          data: { status: 'cancelled', whatsappStatus: 'reagendada' }
        }).catch(() => {});
      }

      // Create appointment
      const serviceToBook = professional.services.find((s: any) => s.id === state.selectedServiceId) || professional.services[0];
      const newAppointment = await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          clientId: targetClient.id,
          serviceId: serviceToBook?.id || professional.services[0]?.id,
          startsAt: slotStart,
          endsAt: slotEnd,
          status: 'confirmed',
          whatsappStatus: 'confirmada',
          clientNote: 'Agendado automáticamente vía WhatsApp Bot'
        }
      });

      // Update client profile stats
      await prisma.clientProfile.upsert({
        where: { clientId: targetClient.id },
        create: {
          clientId: targetClient.id,
          professionalId: professional.id,
          visitCount: 1,
          lastVisitAt: new Date(),
          totalSpent: serviceToBook?.price || 0
        },
        update: {
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
          totalSpent: { increment: serviceToBook?.price || 0 }
        }
      }).catch(() => {});

      // Sincronizar con Google Calendar si está habilitado
      if (professional.googleCalendarConnected && professional.googleRefreshToken) {
        createGoogleCalendarEvent(professional.googleRefreshToken, {
          summary: `Corte: ${targetClient.firstName} ${targetClient.lastName}`,
          description: `Cliente: ${targetClient.firstName} ${targetClient.lastName}\nTeléfono: +${cleanPhone}\nServicio: ${serviceToBook?.name || 'Corte de Autor'}\nAgendado vía WhatsApp Bot`,
          startIso: slotStart.toISOString(),
          endIso: slotEnd.toISOString()
        }).catch((err) => console.error('[WhatsAppBot] Error sync Google Calendar:', err));
      }

      // Reset state to IDLE
      state.step = 'IDLE';
      state.offeredSlots = [];
      state.isRescheduling = false;
      state.rescheduleAppointmentId = undefined;

      const dateReadable = slotStart.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'America/Santiago'
      });

      const confirmationTicket = `✅ *¡CITA AGENDADA CON ÉXITO!* 💈
━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${targetClient.firstName} ${targetClient.lastName}
✂️ *Servicio:* ${serviceToBook?.name || 'Corte de Autor'}
📅 *Fecha:* ${capitalize(dateReadable)}
⏰ *Hora:* ${chosenSlot.timeLabel}
💈 *Profesional:* ${professional.businessName}
📍 *Dirección:* ${professional.address || 'Espejos Studio Pro'}
━━━━━━━━━━━━━━━━━━━
Te esperamos 5 minutos antes. ¡Nos vemos pronto! ✨
_(Si necesitas modificar tu cita, solo escríbenos por aquí)_`;

      await logAssistantReply(professional.id, cleanPhone, confirmationTicket);
      return {
        intent: 'CONFIRMATION',
        appointmentId: newAppointment.id,
        responseMessage: confirmationTicket,
        shouldIgnore: false
      };
    }
  }

  // 6. IDLE STATE: Parse new booking requests or general questions
  const isBookingQuery = lowerText.includes('hora') || lowerText.includes('turno') || lowerText.includes('cita') || 
    lowerText.includes('corte') || lowerText.includes('agendar') || lowerText.includes('reservar') || 
    lowerText.includes('disponible') || lowerText.includes('hueco') || lowerText.includes('barba') ||
    lowerText.includes('hoy') || lowerText.includes('mañana') || lowerText.includes('agenda');

  if (isBookingQuery) {
    // A. EXISTING CLIENT
    if (client) {
      const primaryService = client.appointments[0]?.service || professional.services[0];
      const slots = await getTopAvailableSlotsForBot(professional, primaryService?.durationMinutes || 30);

      if (slots.length > 0) {
        state.step = 'AWAITING_SLOT';
        state.clientId = client.id;
        state.selectedServiceId = primaryService?.id;
        state.offeredSlots = slots;

        const slotsMenu = slots.map(s => s.formattedChoice).join('\n');
        const reply = `¡Hola ${client.firstName}! Qué gusto saludarte 💈.\n\nEstos son los horarios disponibles para tu *${primaryService?.name || 'Corte de Autor'}*:\n\n${slotsMenu}\n5️⃣ 🌐 *Ver otro día / calendario completo*\n\n👉 *Responde con el número de tu opción (ej: 1 o 2).*`;

        await logAssistantReply(professional.id, cleanPhone, reply);
        return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
      } else {
        const reply = `¡Hola ${client.firstName}! Por el momento los cupos de hoy y mañana están completos 💈. Puedes revisar los próximos días disponibles aquí: https://espejosstudio.cl/${professional.slug}`;
        await logAssistantReply(professional.id, cleanPhone, reply);
        return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
      }
    }

    // B. NEW CLIENT (Detect if they already gave their name)
    const possibleName = extractClientName(text);
    if (possibleName && (lowerText.includes('soy') || lowerText.includes('me llamo') || lowerText.includes('mi nombre es'))) {
      const { firstName, lastName } = splitName(possibleName);
      const newClient = await prisma.client.create({
        data: {
          professionalId: professional.id,
          phone: cleanPhone,
          firstName,
          lastName: lastName || ''
        }
      });
      await prisma.clientProfile.create({
        data: { clientId: newClient.id, professionalId: professional.id, tags: '["whatsapp_bot"]' }
      });

      state.clientId = newClient.id;
      state.clientName = firstName;

      const slots = await getTopAvailableSlotsForBot(professional, 30);
      if (slots.length > 0) {
        state.step = 'AWAITING_SLOT';
        state.selectedServiceId = professional.services[0]?.id;
        state.offeredSlots = slots;

        const slotsMenu = slots.map(s => s.formattedChoice).join('\n');
        const reply = `¡Mucho gusto, *${firstName}*! Bienvenido a *${professional.businessName}* 💈.\n\nTenemos estos horarios disponibles:\n\n${slotsMenu}\n5️⃣ 🌐 *Ver otro día*\n\n👉 *Responde con el número de tu opción (ej: 1).*`;
        await logAssistantReply(professional.id, cleanPhone, reply);
        return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
      }
    }

    // Ask for new client's name
    state.step = 'AWAITING_NAME';
    const reply = `¡Hola! Bienvenido a *${professional.businessName}* 💈. Con mucho gusto te ayudamos a coordinar tu cita.\n\nPara comenzar, ¿cuál es tu nombre y apellido?`;
    await logAssistantReply(professional.id, cleanPhone, reply);
    return { intent: 'BOOKING_INQUIRY', responseMessage: reply, shouldIgnore: false };
  }

  // 7. General Questions / Pricing / Visagism Inquiry -> Gemini 2.0 Flash
  if (client || lowerText.includes('precio') || lowerText.includes('cuanto') || lowerText.includes('donde') || lowerText.includes('direccion') || lowerText.includes('visagismo')) {
    const aiReply = await generateGeminiBotReply(professional, client, msg.messageText);
    await logAssistantReply(professional.id, cleanPhone, aiReply);
    return {
      intent: 'GENERAL_QUESTION',
      responseMessage: aiReply,
      shouldIgnore: false
    };
  }

  // Unknown non-booking message -> Personal chat, ignore
  return {
    intent: 'PERSONAL',
    shouldIgnore: true
  };
}

/**
 * Generates natural conversation reply using Gemini 2.0 Flash / LLM Engine
 */
async function generateGeminiBotReply(
  professional: any,
  client: any,
  userMessage: string
): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const servicesList = professional.services?.map((s: any) => `- ${s.name}: $${s.price.toLocaleString('es-CL')} (${s.durationMinutes} min)`).join('\n') || 'Corte Signature, Perfilado de Barba';

  const toneInstructions = {
    cercano: 'Habla como un barbero chileno/latino cercano, relajado, buena onda, usando lenguaje natural ("hola bro", "cómo estás", "te tinca a las 5?", "nos vemos en el local"). Sé conciso y amigable.',
    profesional: 'Habla de forma muy educada, profesional y cordial ("Estimado", "Un gusto saludarle", "Con mucho gusto le reservamos").',
    directo: 'Sé muy breve, conciso y ve directo al punto con los horarios y enlaces sin rodeos.'
  }[professional.whatsappTone as 'cercano' | 'profesional' | 'directo'] || 'Habla de forma amigable y natural.';

  const fewShotContext = professional.whatsappFewShotExamples ? `\nEJEMPLOS DE CÓMO SUELE RESPONDER ESTE BARBERO:\n${professional.whatsappFewShotExamples}\n` : '';

  const systemPrompt = `Eres el asistente virtual de WhatsApp de "${professional.businessName}", atendido por ${professional.businessName}.
Tu objetivo es responder de manera ultra natural, amigable y fluida para ayudar a agendar horas, dar información de precios y dirección.

REGLAS DE ORO:
1. ${toneInstructions}
2. ${fewShotContext}
3. SERVICIOS Y PRECIOS DISPONIBLES:
${servicesList}
4. DIRECCIÓN DEL LOCAL: ${professional.address || 'Providencia, Santiago'}
5. ENLACE DIRECTO DE RESERVAS: https://espejosstudio.cl/${professional.slug}
6. Respuestas CORTAS (máximo 2 a 3 líneas).
7. Si el cliente quiere agendar, dile que puede escribir "Quiero agendar" o ver los cupos en https://espejosstudio.cl/${professional.slug}.`;

  try {
    if (geminiApiKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${geminiApiKey}`
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    }
  } catch (err) {
    console.error('[WhatsAppBot] Error calling Gemini API, using natural fallback:', err);
  }

  const link = `https://espejosstudio.cl/${professional.slug}`;
  const clientGreeting = client?.firstName ? `¡Hola ${client.firstName}! ` : '¡Hola! ';
  return `${clientGreeting}Para consultar disponibilidad o agendar tu cita, escribe *"Quiero agendar"* o entra a: ${link} 💈 ¡Te esperamos!`;
}

async function logAssistantReply(professionalId: string, phone: string, content: string) {
  try {
    await prisma.whatsAppMessageLog.create({
      data: {
        professionalId,
        phone,
        role: 'assistant',
        content
      }
    });
  } catch (e) {
    console.error('[WhatsAppBot] Error logging reply:', e);
  }
}

function parseChoiceNumber(text: string): number | null {
  const digitMatch = text.match(/\b([1-5])\b/);
  if (digitMatch) return parseInt(digitMatch[1], 10);

  if (text.includes('primera') || text.includes('primero') || text.includes('uno') || text.includes('la 1')) return 1;
  if (text.includes('segunda') || text.includes('segundo') || text.includes('dos') || text.includes('la 2')) return 2;
  if (text.includes('tercera') || text.includes('tercero') || text.includes('tres') || text.includes('la 3')) return 3;
  if (text.includes('cuarta') || text.includes('cuarto') || text.includes('cuatro') || text.includes('la 4')) return 4;
  if (text.includes('quinta') || text.includes('quinto') || text.includes('cinco') || text.includes('la 5')) return 5;

  return null;
}

function extractClientName(text: string): string | null {
  let cleaned = text
    .replace(/^(hola|buenas|buenos dias|buenas tardes|buenas noches|estimado|oye|bro|saludos)\b[\s,]*/gi, '')
    .replace(/^(soy|me llamo|mi nombre es|por aca|por acá)\s+/gi, '')
    .trim();

  // If text is too long or contains punctuation, keep first 2-3 words
  const words = cleaned.split(/\s+/).filter(w => w.length > 1 && !w.includes('http') && !w.includes('.cl'));
  if (words.length === 0) return null;

  return words.slice(0, 2).map(capitalize).join(' ');
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ? capitalize(parts[0]) : 'Cliente';
  const lastName = parts.slice(1).map(capitalize).join(' ');
  return { firstName, lastName };
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
