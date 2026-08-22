/** Uzbekistan mobile operator prefixes (2 digits after +998). */
export const UZ_OPERATOR_PREFIXES = [
  '33',
  '71',
  '88',
  '90',
  '91',
  '92',
  '93',
  '94',
  '95',
  '97',
  '98',
  '99',
  '20',
] as const;

/** Nine national digits (without country code). */
export function isValidUzPhone9(digits: string): boolean {
  if (!/^\d{9}$/.test(digits)) return false;
  const prefix = digits.slice(0, 2);
  return (UZ_OPERATOR_PREFIXES as readonly string[]).includes(prefix);
}

/** Display `901234567` as `90 123 45 67`. */
export function formatUzNationalDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

export const UZ_PHONE_INLINE_ERROR_UZ = "Bunday operator kodi mavjud emas yoki raqam noto'g'ri.";
export const UZ_PHONE_INLINE_ERROR_RU = 'Неверный код оператора или номер.';
