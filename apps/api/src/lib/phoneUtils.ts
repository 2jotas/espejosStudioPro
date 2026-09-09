/**
 * Phone Number Utilities for Chile (E.164 standardization)
 */

/**
 * Normalizes any Chilean phone number format to standard E.164: +569XXXXXXXX
 * Examples handled:
 *   "+56 9 1234 5678" -> "+56912345678"
 *   "56912345678"     -> "+56912345678"
 *   "912345678"       -> "+56912345678"
 *   "12345678"        -> "+56912345678"
 */
export function normalizePhoneChile(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.startsWith('569') && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.startsWith('56') && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.startsWith('9') && digits.length === 9) {
    return `+56${digits}`;
  }
  if (digits.length === 8) {
    return `+569${digits}`;
  }
  if (digits.length > 0) {
    return `+${digits}`;
  }
  return '';
}

/**
 * Formats E.164 phone number into clean readable format: +56 9 1234 5678
 */
export function formatChilePhoneDisplay(e164Phone: string): string {
  const digits = e164Phone.replace(/\D/g, '');
  if (digits.startsWith('569') && digits.length === 11) {
    const num = digits.slice(3);
    return `+56 9 ${num.slice(0, 4)} ${num.slice(4)}`;
  }
  if (digits.startsWith('56') && digits.length === 11) {
    const num = digits.slice(2);
    return `+56 9 ${num.slice(1, 5)} ${num.slice(5)}`;
  }
  return e164Phone;
}

/**
 * Returns digits-only for WhatsApp wa.me links: 569XXXXXXXX
 */
export function getWaMeDigits(rawPhone: string): string {
  const normalized = normalizePhoneChile(rawPhone);
  return normalized.replace(/\D/g, '');
}
