import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks for upcoming appointments and dispatches WhatsApp reminders 1-2 hours ahead
 */
export async function runAppointmentRemindersCheck(): Promise<{ processed: number; sent: number }> {
  const now = new Date();
  // Lookahead window: between 30 minutes and 3 hours from now
  const windowStart = new Date(now.getTime() + 30 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const pendingAppointments = await prisma.appointment.findMany({
    where: {
      startsAt: {
        gte: windowStart,
        lte: windowEnd
      },
      status: { in: ['pending', 'confirmed'] },
      whatsappReminderSentAt: null
    },
    include: {
      professional: true,
      client: true,
      service: true
    }
  });

  let sentCount = 0;

  for (const appt of pendingAppointments) {
    if (!appt.professional.whatsappConnected || !appt.client.phone) {
      continue;
    }

    const timeStr = new Date(appt.startsAt).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const clientName = appt.client.firstName || 'estimado';
    const businessName = appt.professional.businessName;
    const serviceName = appt.service.name;
    const address = appt.professional.address ? ` en ${appt.professional.address}` : '';

    const reminderMessage = `¡Hola ${clientName}! 👋 Te recordamos tu cita de *${serviceName}* hoy a las *${timeStr}* con *${businessName}*${address}.\n\n¿Nos confirmas tu asistencia? 💈\n👉 Responde *'Confirmo'* para asegurar tu cupo o *'Cancelar'* si te surgió algún imprevisto.`;

    try {
      // Mark reminder as sent and set status to 'pendiente' (🟣 Púrpura)
      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          whatsappReminderSentAt: new Date(),
          whatsappStatus: appt.whatsappStatus === 'confirmada' ? 'confirmada' : 'pendiente'
        }
      });

      // Log to WhatsApp history
      await prisma.whatsAppMessageLog.create({
        data: {
          professionalId: appt.professionalId,
          phone: appt.client.phone,
          role: 'assistant',
          content: reminderMessage
        }
      });

      sentCount++;
      console.log(`[ReminderCron] Sent reminder to ${appt.client.phone} for appointment ${appt.id}`);
    } catch (err) {
      console.error(`[ReminderCron] Error sending reminder for appointment ${appt.id}:`, err);
    }
  }

  return { processed: pendingAppointments.length, sent: sentCount };
}
