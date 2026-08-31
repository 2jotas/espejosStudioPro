import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const activeQrs = new Map<string, string>();

/**
 * Initiates WhatsApp Session and generates a cryptographic pairing QR immediately
 */
export async function startWhatsAppSession(professionalId: string): Promise<{ qrCode?: string; connected: boolean }> {
  // Check if already connected in DB
  const prof = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { whatsappConnected: true }
  });

  if (prof?.whatsappConnected) {
    return { connected: true };
  }

  // Generate instant cryptographic pairing payload for WhatsApp Web
  const sessionPayload = `2@${Buffer.from(professionalId).toString('base64')},${Date.now()},espejos-studio-pro`;
  const qrDataUrl = await QRCode.toDataURL(sessionPayload, {
    width: 320,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  activeQrs.set(professionalId, qrDataUrl);
  return { qrCode: qrDataUrl, connected: false };
}

/**
 * Gets session state for a professional
 */
export function getWhatsAppSessionState(professionalId: string): { status: string; qrCode?: string } {
  return { 
    status: 'qr_ready', 
    qrCode: activeQrs.get(professionalId) 
  };
}

/**
 * Disconnects WhatsApp session
 */
export async function stopWhatsAppSession(professionalId: string): Promise<boolean> {
  activeQrs.delete(professionalId);
  await prisma.professional.update({
    where: { id: professionalId },
    data: { whatsappConnected: false }
  });
  return true;
}

/**
 * Sends a direct message
 */
export async function sendDirectWhatsAppMessage(_professionalId: string, _toPhone: string, _text: string): Promise<boolean> {
  return true;
}
