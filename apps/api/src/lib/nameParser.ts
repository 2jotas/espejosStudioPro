/**
 * Spanish / Chilean Name Parser & Cleaner Engine
 */

export interface ParsedNameResult {
  firstName: string;
  lastName: string;
  displayName: string;
  rawName: string;
  suggestedTag?: string;
  suggestedNote?: string;
  isCalendarBlock: boolean;
}

const COMMON_COMPOUND_FIRST_NAMES = new Set([
  'juan pablo',
  'maria jose',
  'maria jesus',
  'jose ignacio',
  'carlos alberto',
  'luis felipe',
  'ana maria',
  'juan carlos',
  'diego ignacio',
  'victor manuel',
  'francisco javier',
  'jose manuel',
  'juan manuel',
  'maria ignacia',
  'maria paz',
  'maria teresa'
]);

function toTitleCase(word: string): string {
  if (!word) return '';
  const lower = word.toLowerCase();
  // Don't capitalize small particles unless it's the first word
  if (['de', 'del', 'la', 'las', 'los', 'y', 'e', 'van', 'von'].includes(lower)) {
    return lower;
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Parses and cleans messy name strings from Google Calendar, WhatsApp, or Walk-in input
 */
export function parseNombre(raw: string): ParsedNameResult {
  const rawClean = (raw || '').trim();
  if (!rawClean) {
    return {
      firstName: 'Cliente',
      lastName: '',
      displayName: 'Cliente',
      rawName: '',
      isCalendarBlock: false,
    };
  }

  let cleaned = rawClean;
  let suggestedTag: string | undefined;
  let suggestedNote: string | undefined;
  let isCalendarBlock = false;

  // Detect calendar-specific blocks or automated entries
  const lowerRaw = cleaned.toLowerCase();
  if (
    lowerRaw.includes('bloqueo') ||
    lowerRaw.includes('cerrado') ||
    lowerRaw.includes('almuerzo') ||
    lowerRaw.includes('descanso') ||
    lowerRaw.includes('personal') ||
    lowerRaw.includes('no disponible')
  ) {
    isCalendarBlock = true;
  }

  // Remove common calendar prefixes and filler strings
  cleaned = cleaned.replace(/^["']+|["']+$/g, ''); // quotes
  cleaned = cleaned.replace(/^(Ficha creada(?:\s+por)?|Cita(?:\s+para)?|Reserva(?:\s+de)?|Turno(?:\s+de)?|Corte de cabello|Corte y barba|Corte)\s*[:\-–]?\s*/i, '');
  cleaned = cleaned.replace(/\s*\(?(?:Google Assistant|Google Calendar|Asistente)\)?\s*/gi, ' ');
  cleaned = cleaned.replace(/\s*-\s*corte(?:\s+de\s+cabello)?\s*/gi, ' ');
  cleaned = cleaned.replace(/\s*-\s*barber[ií]a\s*/gi, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Check for "hijo" / "hija" suffix (e.g. "Lucas hijo", "Carlos hijo")
  const hijoMatch = cleaned.match(/^(.+?)\s+(hijo|hija)$/i);
  if (hijoMatch) {
    cleaned = hijoMatch[1].trim();
    suggestedTag = 'padre_hijo';
    suggestedNote = `Cliente hijo (${hijoMatch[2].toLowerCase()})`;
  }

  // Split tokens
  const rawTokens = cleaned.split(' ').filter(Boolean);
  if (rawTokens.length === 0) {
    return {
      firstName: 'Cliente',
      lastName: '',
      displayName: 'Cliente',
      rawName: rawClean,
      suggestedTag,
      suggestedNote,
      isCalendarBlock,
    };
  }

  // Format tokens into TitleCase
  const formattedTokens = rawTokens.map((t, idx) => {
    const formatted = toTitleCase(t);
    // Force first token to be capitalized even if it's a particle
    if (idx === 0) {
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return formatted;
  });

  let firstName = '';
  let lastName = '';

  if (formattedTokens.length === 1) {
    firstName = formattedTokens[0];
    lastName = '';
  } else if (formattedTokens.length === 2) {
    firstName = formattedTokens[0];
    lastName = formattedTokens[1];
  } else {
    // 3 or more tokens: check if first two make a compound name
    const firstTwo = `${formattedTokens[0]} ${formattedTokens[1]}`.toLowerCase();
    if (COMMON_COMPOUND_FIRST_NAMES.has(firstTwo)) {
      firstName = `${formattedTokens[0]} ${formattedTokens[1]}`;
      lastName = formattedTokens.slice(2).join(' ');
    } else {
      firstName = formattedTokens[0];
      lastName = formattedTokens.slice(1).join(' ');
    }
  }

  const displayName = `${firstName} ${lastName}`.trim();

  return {
    firstName,
    lastName,
    displayName,
    rawName: rawClean,
    suggestedTag,
    suggestedNote,
    isCalendarBlock,
  };
}
