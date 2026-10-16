import type { TrustedVendor } from '../types/constitution';
import type { PayPalMcpWriteTool } from '../types/mcp';

export const ALL_WRITE_TOOLS: PayPalMcpWriteTool[] = [
  'pay_order',
  'record_payment_for_invoice',
  'create_order',
  'create_refund',
  'accept_dispute_claim',
  'update_subscription',
  'cancel_subscription'
];

export function extractSingleDirective(
  markdown: string,
  label: string,
  warnings: string[]
): string | null {
  const prefix = `- ${label}:`;
  const lines = markdown
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.toLowerCase().startsWith(prefix.toLowerCase()));

  if (lines.length === 0) {
    warnings.push(`Missing required "${label}" directive.`);
    return null;
  }
  if (lines.length > 1) {
    warnings.push(`Duplicate "${label}" directive (${lines.length} occurrences).`);
    return null;
  }
  return lines[0].slice(prefix.length).trim();
}

export function parseStrictTools(
  raw: string | null,
  warnings: string[]
): PayPalMcpWriteTool[] {
  if (raw === null) return [];
  if (raw.trim() === '' || raw.trim().toLowerCase() === 'none') return [];

  const tokens = raw.split(',').map(s => s.trim());
  const valid: PayPalMcpWriteTool[] = [];

  for (const token of tokens) {
    if ((ALL_WRITE_TOOLS as string[]).includes(token)) {
      if (!valid.includes(token as PayPalMcpWriteTool)) {
        valid.push(token as PayPalMcpWriteTool);
      }
    } else {
      warnings.push(`Unknown tool capability "${token}" in Allowed Tools.`);
      return [];
    }
  }
  return valid;
}

export function parseStrictVendors(
  raw: string | null,
  warnings: string[]
): TrustedVendor[] {
  if (raw === null) return [];
  if (raw.trim() === '' || raw.trim().toLowerCase() === 'none') return [];

  const entries = raw.split(',');
  const vendors: TrustedVendor[] = [];
  for (const entry of entries) {
    const m = entry.trim().match(/^([^()]+?)\s*\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)$/);
    if (!m || !m[1] || !m[2]) {
      warnings.push(`Malformed Trusted Vendor entry: "${entry.trim()}".`);
      return [];
    }
    vendors.push({ name: m[1].trim(), email: m[2].trim().toLowerCase() });
  }
  return vendors;
}
