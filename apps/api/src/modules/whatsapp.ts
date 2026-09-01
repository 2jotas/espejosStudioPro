import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticateProfessional } from '../plugins/authHook.js';
import { classifyAndProcessMessage } from '../services/whatsappBotService.js';
import { runAppointmentRemindersCheck } from '../services/appointmentReminderCron.js';
import { 
  startWhatsAppSession, 
  getWhatsAppSessionState, 
  stopWhatsAppSession, 
  sendDirectWhatsAppMessage 
} from '../services/whatsappSessionService.js';

const prisma = new PrismaClient();

export const whatsappRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper to extract authenticated professional ID
  const getProfId = (req: any): string => req.userSession?.id || req.user?.id;

  // 1. Get WhatsApp Status & Bot Settings for Logged-in Professional
  fastify.get('/status', {
    preHandler: [authenticateProfessional]
  }, async (request: any, reply) => {
    const professionalId = getProfId(request);
    if (!professionalId) {
      return reply.code(401).send({ error: 'No autenticado' });
    }

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        whatsappConnected: true,
        whatsappBotEnabled: true,
        whatsappTone: true,
        whatsappCustomPrompt: true,
        whatsappFewShotExamples: true,
        whatsappReminderHours: true,
        phone: true
      }
    });

    if (!professional) {
      return reply.code(404).send({ error: 'Profesional no encontrado' });
    }

    const { status, qrCode } = getWhatsAppSessionState(professionalId);

    return reply.send({
      connected: professional.whatsappConnected || status === 'open',
      botEnabled: professional.whatsappBotEnabled,
      tone: professional.whatsappTone,
      customPrompt: professional.whatsappCustomPrompt || '',
      fewShotExamples: professional.whatsappFewShotExamples || '',
      reminderHours: professional.whatsappReminderHours,
      phone: professional.phone,
      qrCode: qrCode || null,
      sessionStatus: status
    });
  });

  // 2. Request QR Code / Connect WhatsApp
  fastify.post('/connect', {
    preHandler: [authenticateProfessional]
  }, async (request: any, reply) => {
    const professionalId = getProfId(request);
    if (!professionalId) {
      return reply.code(401).send({ error: 'No autenticado' });
    }

    try {
      const result = await startWhatsAppSession(professionalId);

      return reply.send({
        success: true,
        qrCode: result.qrCode || null,
        connected: result.connected,
        message: result.connected 
          ? 'WhatsApp ya está conectado' 
          : 'Escanea el código QR desde Dispositivos Vinculados en tu WhatsApp'
      });
    } catch (err: any) {
      console.error('[WhatsApp Route] Error starting session:', err);
      return reply.code(500).send({ error: 'No se pudo iniciar la sesión de WhatsApp' });
    }
  });

  // 3. Disconnect WhatsApp
  fastify.post('/disconnect', {
    preHandler: [authenticateProfessional]
  }, async (request: any, reply) => {
    const professionalId = getProfId(request);
    if (!professionalId) {
      return reply.code(401).send({ error: 'No autenticado' });
    }

    await stopWhatsAppSession(professionalId);

    return reply.send({ success: true, message: 'WhatsApp desconectado correctamente' });
  });

  // 4. Update Bot Settings & Few-Shot Training Examples
  fastify.put('/settings', {
    preHandler: [authenticateProfessional]
  }, async (request: any, reply) => {
    const professionalId = getProfId(request);
    if (!professionalId) {
      return reply.code(401).send({ error: 'No autenticado' });
    }
    const { botEnabled, tone, customPrompt, fewShotExamples, reminderHours } = request.body || {};

    const updated = await prisma.professional.update({
      where: { id: professionalId },
      data: {
        whatsappBotEnabled: botEnabled !== undefined ? Boolean(botEnabled) : undefined,
        whatsappTone: tone || undefined,
        whatsappCustomPrompt: customPrompt !== undefined ? customPrompt : undefined,
        whatsappFewShotExamples: fewShotExamples !== undefined ? fewShotExamples : undefined,
        whatsappReminderHours: reminderHours ? Number(reminderHours) : undefined
      },
      select: {
        whatsappConnected: true,
        whatsappBotEnabled: true,
        whatsappTone: true,
        whatsappCustomPrompt: true,
        whatsappFewShotExamples: true,
        whatsappReminderHours: true
      }
    });

    return reply.send({
      success: true,
      settings: updated,
      message: 'Configuración y entrenamiento del bot guardados con éxito'
    });
  });

  // 5. Live Bot Interactive Simulator / Test Chat
  fastify.post('/test-chat', {
    preHandler: [authenticateProfessional]
  }, async (request: any, reply) => {
    const professionalId = getProfId(request);
    if (!professionalId) {
      return reply.code(401).send({ error: 'No autenticado' });
    }
    const { message, senderPhone } = request.body || {};

    if (!message) {
      return reply.code(400).send({ error: 'El mensaje es requerido' });
    }

    const result = await classifyAndProcessMessage({
      professionalId,
      fromPhone: senderPhone || '56912345678',
      senderName: 'Cliente Prueba',
      messageText: message
    });

    return reply.send({
      success: true,
      intent: result.intent,
      reply: result.responseMessage || '(El bot consideró este mensaje como personal y decidió no responder)',
      shouldIgnore: result.shouldIgnore,
      appointmentId: result.appointmentId
    });
  });

  // 6. Incoming Webhook from Evolution API / Baileys
  fastify.post('/webhook', async (request: any, reply) => {
    const body = request.body || {};
    const professionalId = body.professionalId || request.query?.professionalId;
    const fromPhone = body.data?.key?.remoteJid?.split('@')[0] || body.from;
    const messageText = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text || body.text || '';

    if (!fromPhone || !messageText || !professionalId) {
      return reply.code(200).send({ status: 'ignored_missing_data' });
    }

    const result = await classifyAndProcessMessage({
      professionalId,
      fromPhone,
      senderName: body.data?.pushName || 'Cliente',
      messageText
    });

    return reply.send({ status: 'processed', result });
  });

  // 7. Manual trigger for appointment reminder
  fastify.post<{ Params: { appointmentId: string } }>('/send-reminder/:appointmentId', {
    preHandler: [authenticateProfessional]
  }, async (request, reply) => {
    const { appointmentId } = request.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, professional: true, service: true }
    });

    if (!appointment) {
      return reply.code(404).send({ error: 'Cita no encontrada' });
    }

    const timeStr = new Date(appointment.startsAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const reminderText = `¡Hola ${appointment.client.firstName}! 👋 Te recordamos tu cita de *${appointment.service.name}* hoy a las *${timeStr}* con *${appointment.professional.businessName}*.\n\n¿Nos confirmas tu asistencia? 💈\n👉 Responde *'Confirmo'* o *'Cancelar'*.`;

    // Try direct sending via connected WhatsApp socket
    await sendDirectWhatsAppMessage(appointment.professionalId, appointment.client.phone, reminderText);

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        whatsappReminderSentAt: new Date(),
        whatsappStatus: 'pendiente'
      }
    });

    await prisma.whatsAppMessageLog.create({
      data: {
        professionalId: appointment.professionalId,
        phone: appointment.client.phone,
        role: 'assistant',
        content: reminderText
      }
    });

    return reply.send({
      success: true,
      message: `Recordatorio enviado a ${appointment.client.phone}`,
      whatsappStatus: 'pendiente'
    });
  });

  // 8. Cron endpoint for running periodic reminder checks
  fastify.post('/cron/check-reminders', async (_request, reply) => {
    const result = await runAppointmentRemindersCheck();
    return reply.send({ success: true, ...result });
  });
};

export default whatsappRoutes;
