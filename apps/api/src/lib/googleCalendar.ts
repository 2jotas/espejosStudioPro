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
  busyRanges: BusyRange[]; // From Google Calendar or local appointments
  workStartHour?: number; // default 9
  workEndHour?: number; // default 19
}): Array<{ timeStr: string; startIso: string; endIso: string }> {
  const { dateStr, durationMinutes, busyRanges, workStartHour = 9, workEndHour = 19 } = params;

  const slots: Array<{ timeStr: string; startIso: string; endIso: string }> = [];

  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) return slots;

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);

  const startOfDay = new Date(Date.UTC(year, month, day, workStartHour, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month, day, workEndHour, 0, 0));

  let currentPointer = new Date(startOfDay.getTime());

  while (currentPointer.getTime() + durationMinutes * 60 * 1000 <= endOfDay.getTime()) {
    const slotStart = new Date(currentPointer.getTime());
    const slotEnd = new Date(currentPointer.getTime() + durationMinutes * 60 * 1000);

    // Check overlap with busy ranges
    const isConflict = busyRanges.some((busy) => {
      return slotStart < busy.end && slotEnd > busy.start;
    });

    if (!isConflict) {
      const hoursStr = String(slotStart.getUTCHours()).padStart(2, '0');
      const minsStr = String(slotStart.getUTCMinutes()).padStart(2, '0');
      slots.push({
        timeStr: `${hoursStr}:${minsStr}`,
        startIso: slotStart.toISOString(),
        endIso: slotEnd.toISOString(),
      });
    }

    // Step by 15 minutes
    currentPointer = new Date(currentPointer.getTime() + 15 * 60 * 1000);
  }

  return slots;
}
