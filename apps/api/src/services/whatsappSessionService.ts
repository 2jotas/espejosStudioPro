import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  WASocket 
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { classifyAndProcessMessage } from './whatsappBotService.js';

const prisma = new PrismaClient();

// Active WhatsApp Sockets per professionalId
const activeSockets = new Map<string, WASocket>();
const activeQrs = new Map<string, string>(); // stores base64 PNG QR code
const connectionStatus = new Map<string, 'connecting' | 'open' | 'close' | 'qr_ready'>();

const SESSIONS_DIR = path.resolve(process.cwd(), './sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Initializes or starts a WhatsApp Web session for a professional
 */
export async function startWhatsAppSession(professionalId: string): Promise<{ qrCode?: string; connected: boolean }> {
  // If already open, return connected
  const existingSocket = activeSockets.get(professionalId);
  if (existingSocket && connectionStatus.get(professionalId) === 'open') {
    return { connected: true };
  }

  const sessionPath = path.join(SESSIONS_DIR, `auth_${professionalId}`);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  return new Promise(async (resolve) => {
    try {
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Espejos Studio Pro', 'Chrome', '1.0.0'],
        syncFullHistory: false,
      });

      activeSockets.set(professionalId, sock);
      connectionStatus.set(professionalId, 'connecting');

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          // Generate actual cryptographic QR Code image in base64 PNG
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, {
              width: 300,
              margin: 2,
              color: { dark: '#000000', light: '#ffffff' }
            });
            activeQrs.set(professionalId, qrDataUrl);
            connectionStatus.set(professionalId, 'qr_ready');
            resolve({ qrCode: qrDataUrl, connected: false });
          } catch (err) {
            console.error('[WhatsApp] Error generating QR code image:', err);
          }
        }

        if (connection === 'open') {
          console.log(`[WhatsApp] Professional ${professionalId} successfully connected to WhatsApp Web!`);
          activeQrs.delete(professionalId);
          connectionStatus.set(professionalId, 'open');

          await prisma.professional.update({
            where: { id: professionalId },
            data: { whatsappConnected: true }
          });

          resolve({ connected: true });
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log(`[WhatsApp] Session closed for ${professionalId}. Reconnect:`, shouldReconnect);
          connectionStatus.set(professionalId, 'close');

          if (shouldReconnect) {
            startWhatsAppSession(professionalId).catch(console.error);
          } else {
            // Logged out
            activeSockets.delete(professionalId);
            activeQrs.delete(professionalId);
            await prisma.professional.update({
              where: { id: professionalId },
              data: { whatsappConnected: false }
            });
          }
        }
      });

      // Listen to incoming messages in real-time
      sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (msg.key.fromMe) continue; // Ignore own messages
          const remoteJid = msg.key.remoteJid;
          if (!remoteJid || remoteJid.includes('@g.us')) continue; // Ignore group messages

          const fromPhone = remoteJid.split('@')[0];
          const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

          if (!text) continue;

          console.log(`[WhatsApp] Incoming message from ${fromPhone} to professional ${professionalId}: "${text}"`);

          const result = await classifyAndProcessMessage({
            professionalId,
            fromPhone,
            senderName: msg.pushName || 'Cliente',
            messageText: text
          });

          if (!result.shouldIgnore && result.responseMessage) {
            // Send typing presence indicator (human delay simulation)
            await sock.sendPresenceUpdate('composing', remoteJid);
            await new Promise((r) => setTimeout(r, 2000));
            await sock.sendPresenceUpdate('paused', remoteJid);

            await sock.sendMessage(remoteJid, { text: result.responseMessage });
            console.log(`[WhatsApp] Bot replied to ${fromPhone}: "${result.responseMessage}"`);
          }
        }
      });

      // Timeout fallback if QR event takes long
      setTimeout(() => {
        const qr = activeQrs.get(professionalId);
        if (qr) {
          resolve({ qrCode: qr, connected: false });
        } else {
          resolve({ connected: connectionStatus.get(professionalId) === 'open' });
        }
      }, 3500);

    } catch (err) {
      console.error('[WhatsApp] Error starting session:', err);
      resolve({ connected: false });
    }
  });
}

/**
 * Gets the current QR code or status for a professional
 */
export function getWhatsAppSessionState(professionalId: string): { status: string; qrCode?: string } {
  const status = connectionStatus.get(professionalId) || 'close';
  const qrCode = activeQrs.get(professionalId);
  return { status, qrCode };
}

/**
 * Disconnects and deletes session for a professional
 */
export async function stopWhatsAppSession(professionalId: string): Promise<boolean> {
  const sock = activeSockets.get(professionalId);
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {}
    sock.end(undefined);
    activeSockets.delete(professionalId);
  }

  activeQrs.delete(professionalId);
  connectionStatus.set(professionalId, 'close');

  const sessionPath = path.join(SESSIONS_DIR, `auth_${professionalId}`);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  await prisma.professional.update({
    where: { id: professionalId },
    data: { whatsappConnected: false }
  });

  return true;
}

/**
 * Sends a message from the professional's connected WhatsApp
 */
export async function sendDirectWhatsAppMessage(professionalId: string, toPhone: string, text: string): Promise<boolean> {
  const sock = activeSockets.get(professionalId);
  if (!sock) return false;

  const cleanPhone = toPhone.replace(/\D/g, '');
  const jid = `${cleanPhone}@s.whatsapp.net`;

  try {
    await sock.sendPresenceUpdate('composing', jid);
    await new Promise((r) => setTimeout(r, 1500));
    await sock.sendPresenceUpdate('paused', jid);
    await sock.sendMessage(jid, { text });
    return true;
  } catch (err) {
    console.error(`[WhatsApp] Error sending message to ${toPhone}:`, err);
    return false;
  }
}
