import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback';

export function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getGoogleAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
    state,
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export interface BusyRange {
  start: Date;
  end: Date;
}

export async function fetchGoogleBusyRanges(
  refreshToken: string,
  startIso: string,
  endIso: string
): Promise<BusyRange[]> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startIso,
        timeMax: endIso,
        items: [{ id: 'primary' }],
      },
    });

    const busyList = response.data.calendars?.primary?.busy || [];
    return busyList.map((item) => ({
      start: new Date(item.start!),
      end: new Date(item.end!),
    }));
  } catch (err) {
    console.error('Error fetching Google Calendar busy ranges:', err);
    return [];
  }
}

export async function fetchGoogleBusyRangesViaApiKey(
  calendarId: string,
  apiKey: string,
  startIso: string,
  endIso: string
): Promise<BusyRange[]> {
  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?key=${encodeURIComponent(apiKey)}&timeMin=${encodeURIComponent(
      startIso
    )}&timeMax=${encodeURIComponent(endIso)}&singleEvents=true`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error('Error fetching Google Calendar events via API key:', await res.text());
      return [];
    }

    const data = await res.json();
    const items = data.items || [];
    return items
      .filter((item: any) => item.start?.dateTime && item.end?.dateTime)
      .map((item: any) => ({
        start: new Date(item.start.dateTime),
        end: new Date(item.end.dateTime),
      }));
  } catch (err) {
    console.error('Error in fetchGoogleBusyRangesViaApiKey:', err);
    return [];
  }
}

export interface GoogleCalendarEventDetail {
  id: string;
  summary?: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
}

export async function fetchGoogleFullEventsViaApiKey(
  calendarId: string,
  apiKey: string,
  startIso: string,
  endIso: string
): Promise<GoogleCalendarEventDetail[]> {
  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?key=${encodeURIComponent(apiKey)}&timeMin=${encodeURIComponent(
      startIso
    )}&timeMax=${encodeURIComponent(endIso)}&singleEvents=true`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const items = data.items || [];

    return items
      .filter((item: any) => item.start?.dateTime && item.end?.dateTime)
      .map((item: any) => ({
        id: item.id,
        summary: item.summary || 'Cita de Google Calendar',
        description: item.description || '',
        startsAt: new Date(item.start.dateTime),
        endsAt: new Date(item.end.dateTime),
      }));
  } catch (err) {
    console.error('Error fetching full Google Calendar events:', err);
    return [];
  }
}

export async function verifyGoogleApiKeyConnection(
  calendarId: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?key=${encodeURIComponent(apiKey)}&timeMin=${encodeURIComponent(
      now
    )}&maxResults=1`;

    const res = await fetch(url);
    if (res.ok) {
      return { success: true, message: '¡Conexión exitosa! El calendario de Google ha sido verificado.' };
    }

    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.error?.message || 'No se pudo conectar al calendario con esa Clave API y Nombre/ID.';
    return { success: false, message: errorMsg };
  } catch (err: any) {
    return { success: false, message: `Error de red al verificar Google Calendar: ${err.message || err}` };
  }
}

export async function createGoogleCalendarEvent(
  refreshToken: string,
  eventData: {
    summary: string;
    description: string;
    startIso: string;
    endIso: string;
  }
): Promise<string | null> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: eventData.startIso },
        end: { dateTime: eventData.endIso },
      },
    });

    return response.data.id || null;
  } catch (err) {
    console.error('Error creating Google Calendar event:', err);
    return null;
  }
}

/**
 * Calculates available time slots for a given date.
 * Default working hours: 09:00 to 19:00
 * Slot step: 15 minutes
 */
export function calculateAvailableTimeSlots(params: {
  dateStr: string; // YYYY-MM-DD
  durationMinutes: number;
  busyRanges: BusyRange[];
  workStartHour?: number; // default 10 (10:00 AM)
  workEndHour?: number; // default 20 (08:00 PM / 20:00)
  disabledDays?: number[]; // default [2, 3] (Tuesday & Wednesday off)
  blockedSlots?: string[]; // default ['10:00', '20:00']
}): Array<{ timeStr: string; startIso: string; endIso: string }> {
  const {
    dateStr,
    durationMinutes,
    busyRanges,
    workStartHour = 10,
    workEndHour = 20,
    disabledDays = [2, 3], // Tuesday (2) & Wednesday (3) disabled by default
    blockedSlots = ['10:00', '20:00'], // 10:00 AM and 20:00 PM always reserved by default
  } = params;

  const slots: Array<{ timeStr: string; startIso: string; endIso: string }> = [];

  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) return slots;

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);

  const targetDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const dayOfWeek = targetDate.getUTCDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  // If day is disabled (e.g. Tuesday or Wednesday), return no slots
  if (disabledDays.includes(dayOfWeek)) {
    return slots;
  }

  const startOfDay = new Date(Date.UTC(year, month, day, workStartHour, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month, day, workEndHour, 0, 0));

  let currentPointer = new Date(startOfDay.getTime());

  while (currentPointer.getTime() + durationMinutes * 60 * 1000 <= endOfDay.getTime()) {
    const slotStart = new Date(currentPointer.getTime());
    const slotEnd = new Date(currentPointer.getTime() + durationMinutes * 60 * 1000);

    const hoursStr = String(slotStart.getUTCHours()).padStart(2, '0');
    const minsStr = String(slotStart.getUTCMinutes()).padStart(2, '0');
    const timeStr = `${hoursStr}:${minsStr}`;

    // Check if slot is explicitly blocked (e.g. 10:00 or 20:00)
    const isBlocked = blockedSlots.includes(timeStr);

    // Check overlap with busy ranges
    const isConflict = busyRanges.some((busy) => {
      return slotStart < busy.end && slotEnd > busy.start;
    });

    if (!isConflict && !isBlocked) {
      slots.push({
        timeStr,
        startIso: slotStart.toISOString(),
        endIso: slotEnd.toISOString(),
      });
    }

    // Step by 30 minutes
    currentPointer = new Date(currentPointer.getTime() + 30 * 60 * 1000);
  }

  return slots;
}
