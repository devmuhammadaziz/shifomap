/**
 * Known Uzbekistan codes (2 digits after +998), for reference only:
 * Beeline 90 91 92 · OQ 20 · Ucell 93 94 50 · Mobiuz 97 88 87 · Uzmobile 99 77 95 70 ·
 * Perfectum 98 80 · Humans 33 · Uztelecom VoIP 55 · fixed lines 61–79.
 */
export const UZ_KNOWN_PREFIXES = [
  '20', '33', '50', '55', '70', '77', '80', '87', '88',
  '90', '91', '92', '93', '94', '95', '97', '98', '99',
] as const;

/**
 * Nine national digits (without country code). Any operator code is accepted so new
 * ranges work without an app update; no Uzbek code starts with 0 or 1.
 */
export function isValidUzPhone9(digits: string): boolean {
  return /^[2-9]\d{8}$/.test(digits);
}

/** Typed or pasted input → up to 9 national digits ("+998 90 123 45 67" → "901234567"). */
export function toUzNationalDigits(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.length >= 12 && d.startsWith('998')) d = d.slice(3);
  return d.slice(0, 9);
}

/** Display `901234567` as `90 123 45 67`. */
export function formatUzNationalDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

export const UZ_PHONE_INLINE_ERROR_UZ = "Raqam noto'g'ri. Masalan: 90 123 45 67";
export const UZ_PHONE_INLINE_ERROR_RU = 'Неверный номер. Например: 90 123 45 67';
