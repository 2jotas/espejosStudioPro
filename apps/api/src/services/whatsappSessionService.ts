import baileysPkg from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import { classifyAndProcessMessage } from './whatsappBotService.js';

const prisma = new PrismaClient();
const logger = pino({ level: 'silent' });

// Safe interop for Baileys ESM/CJS
const makeWASocket = (baileysPkg as any).default || baileysPkg;
const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = (baileysPkg as any);

// Active sockets and QR states per professional
const activeSockets = new Map<string, any>();
const activeQrs = new Map<string, string>(); // stores base64 PNG data URL
const connectionStatus = new Map<string, 'connecting' | 'open' | 'close' | 'qr_ready'>();
const startingPromises = new Map<string, Promise<{ qrCode?: string; connected: boolean }>>();

const SESSIONS_DIR = path.resolve(process.cwd(), './sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Initializes or starts a real WhatsApp Web session for a professional using Baileys
 */
export async function startWhatsAppSession(professionalId: string): Promise<{ qrCode?: string; connected: boolean }> {
  // If already open, return connected
  const existingSocket = activeSockets.get(professionalId);
  if (existingSocket && connectionStatus.get(professionalId) === 'open') {
    return { connected: true };
  }

  // If already active with a valid QR code ready, return it immediately
  if (existingSocket && activeQrs.has(professionalId)) {
    return { qrCode: activeQrs.get(professionalId), connected: false };
  }

  // If previous socket exists but is closed, clean it up
  if (existingSocket) {
    try {
      existingSocket.end(undefined);
    } catch (e) {}
    activeSockets.delete(professionalId);
  }

  // If a start operation is currently in-flight, return the existing promise
  if (startingPromises.has(professionalId)) {
    return startingPromises.get(professionalId)!;
  }

  const startPromise = (async () => {
    try {
      console.log(`[WhatsApp] Initializing new Baileys session for professional ${professionalId}...`);
      const sessionPath = path.join(SESSIONS_DIR, `auth_${professionalId}`);
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      
      let version: [number, number, number] = [2, 3000, 1015901307];
      try {
        const versionPromise = fetchLatestBaileysVersion();
        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
        const versionInfo: any = await Promise.race([versionPromise, timeoutPromise]);
        if (versionInfo?.version) {
          version = versionInfo.version;
        }
      } catch (vErr) {
        // Fallback default version
      }

      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        logger,
        browser: ['Espejos Studio Pro', 'Chrome', '120.0.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: true,
      });

      activeSockets.set(professionalId, sock);
      connectionStatus.set(professionalId, 'connecting');

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, {
              width: 320,
              margin: 2,
              color: { dark: '#0f172a', light: '#ffffff' }
            });
            activeQrs.set(professionalId, qrDataUrl);
            connectionStatus.set(professionalId, 'qr_ready');
            console.log(`[WhatsApp] Real QR Code generated for professional ${professionalId}`);
          } catch (err) {
            console.error('[WhatsApp] Error converting QR to DataURL:', err);
          }
        }

        if (connection === 'open') {
          console.log(`[WhatsApp] Professional ${professionalId} connected successfully to WhatsApp Web!`);
          activeQrs.delete(professionalId);
          connectionStatus.set(professionalId, 'open');

          try {
            await prisma.professional.update({
              where: { id: professionalId },
              data: { whatsappConnected: true }
            });
          } catch (dbErr) {
            console.error('[WhatsApp] Error updating DB on connect:', dbErr);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          console.log(`[WhatsApp] Session closed for ${professionalId}. Status code: ${statusCode}, LoggedOut: ${isLoggedOut}`);

          activeSockets.delete(professionalId);
          activeQrs.delete(professionalId);
          connectionStatus.set(professionalId, 'close');

          if (isLoggedOut) {
            if (fs.existsSync(sessionPath)) {
              try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
              } catch (e) {}
            }
            try {
              await prisma.professional.update({
                where: { id: professionalId },
                data: { whatsappConnected: false }
              });
            } catch (e) {}
          } else {
            // Reconnect automatically on server restart or brief disconnection
            setTimeout(() => {
              startWhatsAppSession(professionalId).catch(console.error);
            }, 3000);
          }
        }
      });

      // Handle incoming messages for the AI Bot
      sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          if (msg.key.fromMe) continue;
          const remoteJid = msg.key.remoteJid;
          if (!remoteJid || remoteJid.includes('@g.us')) continue; // Ignore groups

          const fromPhone = remoteJid.split('@')[0];
          const text = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || 
                       msg.message?.imageMessage?.caption || '';

          if (!text || !text.trim()) continue;

          console.log(`[WhatsApp] Message from ${fromPhone} to professional ${professionalId}: "${text}"`);

          try {
            const result = await classifyAndProcessMessage({
              professionalId,
              fromPhone,
              senderName: msg.pushName || 'Cliente',
              messageText: text
            });

            if (!result.shouldIgnore && result.responseMessage) {
              await sock.sendPresenceUpdate('composing', remoteJid);
              await new Promise((r) => setTimeout(r, 1500));
              await sock.sendPresenceUpdate('paused', remoteJid);
              await sock.sendMessage(remoteJid, { text: result.responseMessage });
              console.log(`[WhatsApp] Bot replied to ${fromPhone}: "${result.responseMessage}"`);
            }
          } catch (botErr) {
            console.error('[WhatsApp] Error in bot message processing:', botErr);
          }
        }
      });

      // Await initial QR code or connection event (up to 4.5s)
      return await new Promise<{ qrCode?: string; connected: boolean }>((resolve) => {
        let resolved = false;

        const checkInterval = setInterval(() => {
          const qr = activeQrs.get(professionalId);
          const isConn = connectionStatus.get(professionalId) === 'open';

          if (qr || isConn) {
            clearInterval(checkInterval);
            resolved = true;
            resolve({ qrCode: qr, connected: isConn });
          }
        }, 200);

        setTimeout(() => {
          if (!resolved) {
            clearInterval(checkInterval);
            resolve({
              qrCode: activeQrs.get(professionalId),
              connected: connectionStatus.get(professionalId) === 'open'
            });
          }
        }, 4500);
      });

    } catch (err) {
      console.error('[WhatsApp] Fatal error starting session:', err);
      return { connected: false };
    } finally {
      startingPromises.delete(professionalId);
    }
  })();

  startingPromises.set(professionalId, startPromise);
  return startPromise;
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
    try {
      sock.end(undefined);
    } catch (e) {}
    activeSockets.delete(professionalId);
  }

  activeQrs.delete(professionalId);
  connectionStatus.set(professionalId, 'close');

  const sessionPath = path.join(SESSIONS_DIR, `auth_${professionalId}`);
  if (fs.existsSync(sessionPath)) {
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    } catch (e) {}
  }

  try {
    await prisma.professional.update({
      where: { id: professionalId },
      data: { whatsappConnected: false }
    });
  } catch (e) {}

  return true;
}

/**
 * Sends a direct message from the professional's connected WhatsApp
 */
export async function sendDirectWhatsAppMessage(professionalId: string, toPhone: string, text: string): Promise<boolean> {
  const sock = activeSockets.get(professionalId);
  if (!sock) {
    console.warn(`[WhatsApp] Cannot send message: Professional ${professionalId} has no active socket.`);
    return false;
  }

  const cleanPhone = toPhone.replace(/\D/g, '');
  const jid = `${cleanPhone}@s.whatsapp.net`;

  try {
    await sock.sendPresenceUpdate('composing', jid);
    await new Promise((r) => setTimeout(r, 1200));
    await sock.sendPresenceUpdate('paused', jid);
    await sock.sendMessage(jid, { text });
    return true;
  } catch (err) {
    console.error(`[WhatsApp] Error sending direct message to ${toPhone}:`, err);
    return false;
  }
}

/**
 * Auto-initializes sessions for professionals on server startup
 */
export async function initializeWhatsAppSessions(): Promise<void> {
  try {
    const connectedPros = await prisma.professional.findMany({
      where: { whatsappConnected: true },
      select: { id: true }
    });

    for (const pro of connectedPros) {
      const sessionPath = path.join(SESSIONS_DIR, `auth_${pro.id}`);
      if (fs.existsSync(sessionPath)) {
        console.log(`[WhatsApp] Restoring background session for professional ${pro.id}...`);
        startWhatsAppSession(pro.id).catch((err) => {
          console.error(`[WhatsApp] Failed to restore session for ${pro.id}:`, err);
        });
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Error in initializeWhatsAppSessions:', err);
  }
}
