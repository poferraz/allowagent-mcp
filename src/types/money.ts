const STRICT_DECIMAL_RE = /^(0|[1-9]\d{0,8})(\.\d{1,2})?$/;

export function usdCents(value: unknown, allowZero = false): number {
  if (typeof value !== 'string' || !STRICT_DECIMAL_RE.test(value.trim())) {
    throw new Error('INVALID_USD');
  }
  const [whole, fraction = ''] = value.trim().split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < (allowZero ? 0 : 1)) {
    throw new Error('INVALID_USD');
  }
  return cents;
}

export function parseStrictUsdDollar(raw: string, allowZero = true): number | null {
  const cleaned = raw
    .trim()
    .replace(/^\$/, '')
    .replace(/\s*USD$/i, '')
    .trim();
  try {
    const cents = usdCents(cleaned, allowZero);
    return cents / 100;
  } catch {
    return null;
  }
}

export function parseStrictPercentage(raw: string): number | null {
  const cleaned = raw.trim();
  const match = cleaned.match(/^(0|[1-9]\d{0,2})(\.\d{1,2})?%$/);
  if (!match) return null;
  const num = Number.parseFloat(cleaned.slice(0, -1));
  return Number.isFinite(num) && num >= 0 && num <= 1000 ? num : null;
}

export function toCents(amountUsd: number): number {
  if (!Number.isFinite(amountUsd)) return -1;
  return Math.round(amountUsd * 100);
}
