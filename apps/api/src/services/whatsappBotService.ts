import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WhatsAppIncomingMessage {
  fromPhone: string;
  senderName?: string;
  messageText: string;
  professionalId: string;
}

export interface BotClassificationResult {
  intent: 'PERSONAL' | 'CONFIRMATION' | 'CANCELLATION' | 'RESCHEDULE' | 'BOOKING_INQUIRY' | 'GENERAL_QUESTION';
  appointmentId?: string;
  responseMessage?: string;
  shouldIgnore: boolean;
}

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
 * Classifies the incoming message intent using NLP heuristics and Gemini 2.0 Flash
 */
export async function classifyAndProcessMessage(
  msg: WhatsAppIncomingMessage
): Promise<BotClassificationResult> {
  const cleanPhone = normalizePhone(msg.fromPhone);
  const text = msg.messageText.trim().toLowerCase();

  // 1. Fetch professional and bot configuration
  const professional = await prisma.professional.findUnique({
    where: { id: msg.professionalId },
    include: {
      services: { where: { active: true } },
    }
  });

  if (!professional || !professional.whatsappBotEnabled) {
    return { intent: 'PERSONAL', shouldIgnore: true };
  }

  // 2. Fetch existing client and recent appointments
  const client = await prisma.client.findFirst({
    where: {
      professionalId: professional.id,
      phone: { contains: cleanPhone.slice(-8) }
    },
    include: {
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

  // 3. Fast Intent Detection (Keywords & Context)
  const isAffirmative = /^(si|sí|confirmo|voy|confirmado|allá nos vemos|oka|ok|de acuerdo|dale|voy para allá|listo)$/i.test(text) ||
    text.includes('confirmo') || text.includes('si voy') || text.includes('sí voy') || text.includes('alla nos vemos');

  const isNegative = /^(no|cancela|cancelar|no puedo|no voy a poder|me surgió|me complico|anular)$/i.test(text) ||
    text.includes('no podre') || text.includes('no podré') || text.includes('cancela') || text.includes('no voy');

  const isReschedule = text.includes('mover') || text.includes('cambiar hora') || text.includes('reagendar') || text.includes('otra hora') || text.includes('mas tarde') || text.includes('más tarde');

  const isBookingQuery = text.includes('hora') || text.includes('turno') || text.includes('cita') || text.includes('corte') || text.includes('precio') || text.includes('agendar') || text.includes('reservar') || text.includes('disponible') || text.includes('hueco') || text.includes('barba');

  // Log incoming message to context memory
  await prisma.whatsAppMessageLog.create({
    data: {
      professionalId: professional.id,
      phone: cleanPhone,
      role: 'user',
      content: msg.messageText
    }
  });

  // A. CONFIRMATION HANDLING (🟢 Verde)
  if (isAffirmative && nextAppointment) {
    await prisma.appointment.update({
      where: { id: nextAppointment.id },
      data: {
        status: 'confirmed',
        whatsappStatus: 'confirmada'
      }
    });

    const clientName = client?.firstName || msg.senderName || 'estimado';
    const timeStr = new Date(nextAppointment.startsAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const reply = `¡Excelente, ${clientName}! 💈 Tu cita para hoy a las ${timeStr} quedó confirmada al 100%. Te esperamos en ${professional.address || professional.businessName}. ¡Nos vemos pronto! ✨`;

    await logAssistantReply(professional.id, cleanPhone, reply);
    return {
      intent: 'CONFIRMATION',
      appointmentId: nextAppointment.id,
      responseMessage: reply,
      shouldIgnore: false
    };
  }

  // B. CANCELLATION HANDLING (🔴 Rojo)
  if (isNegative && nextAppointment) {
    await prisma.appointment.update({
      where: { id: nextAppointment.id },
      data: {
        status: 'cancelled',
        whatsappStatus: 'cancelada'
      }
    });

    const clientName = client?.firstName || msg.senderName || 'estimado';
    const reply = `Entendido, ${clientName}. He cancelado tu cita sin problemas y liberado el horario. Cuando quieras agendar nuevamente, puedes hacerlo en https://espejosstudio.cl/${professional.slug} 💈 ¡Que tengas un excelente día!`;

    await logAssistantReply(professional.id, cleanPhone, reply);
    return {
      intent: 'CANCELLATION',
      appointmentId: nextAppointment.id,
      responseMessage: reply,
      shouldIgnore: false
    };
  }

  // C. RESCHEDULE HANDLING (🟡 Amarillo)
  if (isReschedule && nextAppointment) {
    await prisma.appointment.update({
      where: { id: nextAppointment.id },
      data: {
        whatsappStatus: 'reagendada'
      }
    });

    const reply = `¡Sin problema! Para elegir tu nuevo horario de inmediato, entra a https://espejosstudio.cl/${professional.slug} y selecciona el horario que mejor te acomode. 💈`;

    await logAssistantReply(professional.id, cleanPhone, reply);
    return {
      intent: 'RESCHEDULE',
      appointmentId: nextAppointment.id,
      responseMessage: reply,
      shouldIgnore: false
    };
  }

  // D. BOOKING INQUIRY OR GENERAL QUESTION
  if (isBookingQuery || client) {
    // Generate personalized AI natural response
    const aiReply = await generateGeminiBotReply(professional, client, msg.messageText);
    await logAssistantReply(professional.id, cleanPhone, aiReply);
    return {
      intent: 'BOOKING_INQUIRY',
      responseMessage: aiReply,
      shouldIgnore: false
    };
  }

  // E. Non-booking message from unknown contact -> Personal message, IGNORE
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
6. Respuestas CORTAS (máximo 2 a 3 líneas). A la gente en WhatsApp no le gustan los párrafos gigantes.
7. Nunca inventes servicios que no estén en la lista. Si te preguntan por horas, invítalos a ver los cupos libres en su link https://espejosstudio.cl/${professional.slug}`;

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

  // Fast Intelligent Conversational Fallbacks based on tone & message content
  const lowerMsg = userMessage.toLowerCase();
  const link = `https://espejosstudio.cl/${professional.slug}`;

  if (lowerMsg.includes('si') || lowerMsg.includes('sí') || lowerMsg.includes('favor') || lowerMsg.includes('dale') || lowerMsg.includes('bueno')) {
    if (professional.whatsappTone === 'profesional') {
      return `¡Con mucho gusto! Puede escoger el horario que mejor le acomode y asegurar su cita aquí: ${link} 💈`;
    }
    return `¡De una bro! 💈 Puedes revisar los horarios libres y elegir el tuyo al instante aquí: ${link}`;
  }

  if (lowerMsg.includes('precio') || lowerMsg.includes('cuanto') || lowerMsg.includes('cuánto') || lowerMsg.includes('valor')) {
    return `¡Hola! Tenemos disponibles nuestros servicios y promociones directamente en: ${link} 💈 ¡Te esperamos!`;
  }

  if (lowerMsg.includes('hora') || lowerMsg.includes('turno') || lowerMsg.includes('cita') || lowerMsg.includes('hoy') || lowerMsg.includes('mañana')) {
    if (professional.whatsappTone === 'profesional') {
      return `Estimado/a, para ver nuestra disponibilidad en tiempo real e ingresar su reserva, visite: ${link} 💈`;
    }
    return `¡Wena! Sí, puedes ver los cupos libres de hoy y agendar al toque en: ${link} 💈`;
  }

  const clientGreeting = client?.firstName ? `¡Hola ${client.firstName}! ` : '¡Hola! ';
  return `${clientGreeting}Para consultar disponibilidad o agendar tu cita, entra aquí: ${link} 💈 ¡Te esperamos!`;
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
