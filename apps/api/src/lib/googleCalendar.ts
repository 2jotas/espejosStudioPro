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
      .filter((item: any) => (item.start?.dateTime || item.start?.date) && (item.end?.dateTime || item.end?.date))
      .map((item: any) => {
        const startStr = item.start.dateTime || `${item.start.date}T10:00:00Z`;
        const endStr = item.end.dateTime || `${item.end.date}T11:00:00Z`;
        return {
          id: item.id,
          summary: item.summary || 'Cita de Google Calendar',
          description: item.description || '',
          startsAt: new Date(startStr),
          endsAt: new Date(endStr),
        };
      });
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
        start: { dateTime: eventData.startIso, timeZone: 'America/Santiago' },
        end: { dateTime: eventData.endIso, timeZone: 'America/Santiago' },
      },
    });

    return response.data.id || null;
  } catch (err) {
    console.error('Error creating Google Calendar event:', err);
    return null;
  }
}

/**
 * Converts a Chilean date string (YYYY-MM-DD) and local time string (HH:mm) into a true UTC Date object
 */
export function getSantiagoUtcDate(dateStr: string, timeStr: string): Date {
  const dummy = new Date(`${dateStr}T${timeStr}:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(dummy);
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const santiagoDateStr = `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}Z`;
  const offsetMs = dummy.getTime() - new Date(santiagoDateStr).getTime();
  return new Date(dummy.getTime() + offsetMs);
}

/**
 * Calculates available time slots for a given date in Chile timezone (America/Santiago).
 * Default working hours: 10:00 to 20:00
 * Slot step: 30 minutes
 */
export function calculateAvailableTimeSlots(params: {
  dateStr: string; // YYYY-MM-DD in America/Santiago
  durationMinutes: number;
  busyRanges: BusyRange[];
  workStartHour?: number; // default 10 (10:00 AM Santiago)
  workEndHour?: number; // default 20 (08:00 PM Santiago)
  disabledDays?: number[];
  blockedSlots?: string[];
}): Array<{ timeStr: string; startIso: string; endIso: string }> {
  const {
    dateStr,
    durationMinutes,
    busyRanges,
    workStartHour = 10,
    workEndHour = 20,
    disabledDays = [],
    blockedSlots = [],
  } = params;

  const slots: Array<{ timeStr: string; startIso: string; endIso: string }> = [];

  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) return slots;

  // Day of week in Santiago
  const middayDate = getSantiagoUtcDate(dateStr, '12:00');
  const dayOfWeekParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', weekday: 'short' }).format(middayDate);
  const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = daysMap[dayOfWeekParts] ?? 0;

  // If day is disabled, return no slots
  if (disabledDays.length > 0 && disabledDays.includes(dayOfWeek)) {
    return slots;
  }

  // Generate slots every 30 minutes from workStartHour to workEndHour
  for (let hour = workStartHour; hour < workEndHour; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      // Check if slot is explicitly blocked (e.g. 10:00 or 20:00)
      if (blockedSlots.includes(timeStr)) {
        continue;
      }

      const slotStart = getSantiagoUtcDate(dateStr, timeStr);
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      // Check if slot extends past working hours
      const closingTime = getSantiagoUtcDate(dateStr, `${String(workEndHour).padStart(2, '0')}:00`);
      if (slotEnd.getTime() > closingTime.getTime()) {
        continue;
      }

      // Check overlap with busy ranges (database appointments & Google Calendar events)
      const isConflict = busyRanges.some((busy) => {
        return slotStart < busy.end && slotEnd > busy.start;
      });

      if (!isConflict) {
        slots.push({
          timeStr,
          startIso: slotStart.toISOString(),
          endIso: slotEnd.toISOString(),
        });
      }
    }
  }

  return slots;
}
