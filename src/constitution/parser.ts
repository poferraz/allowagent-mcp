import type {
  ConstitutionMode,
  SpendPolicy,
  UnknownVendorPolicy
} from '../types/constitution';
import { parseStrictPercentage, parseStrictUsdDollar } from '../types/money';
import {
  extractSingleDirective,
  parseStrictTools,
  parseStrictVendors
} from './directives';

function parseStrictBool(
  markdown: string,
  label: string,
  warnings: string[]
): boolean {
  const raw = extractSingleDirective(markdown, label, warnings);
  if (raw === null) return true;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  warnings.push(`Invalid boolean for "${label}": "${raw}".`);
  return true;
}

export function compileConstitution(
  markdown: string,
  fallbackMode: ConstitutionMode = 'PERSONAL'
): SpendPolicy {
  const warnings: string[] = [];
  const modeLines = markdown
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => /^Mode:/i.test(l));

  let mode: ConstitutionMode = fallbackMode;
  if (modeLines.length === 1) {
    const m = modeLines[0].match(/^Mode:\s*(PERSONAL|BUSINESS)$/i);
    if (m && m[1]) {
      mode = m[1].toUpperCase() as ConstitutionMode;
    } else {
      warnings.push(`Invalid Mode line: "${modeLines[0]}".`);
    }
  } else {
    warnings.push('Missing or duplicate "Mode:" declaration.');
  }

  const rawMaxPay = extractSingleDirective(markdown, 'Max Auto-Pay', warnings);
  const rawDailyCap = extractSingleDirective(markdown, 'Daily Spend Limit', warnings);
  const rawMaxRefund = extractSingleDirective(markdown, 'Max Auto-Refund', warnings);
  const rawCreep = extractSingleDirective(markdown, 'Price Creep Tolerance', warnings);
  const rawTools = extractSingleDirective(markdown, 'Allowed Tools', warnings);
  const rawVendors = extractSingleDirective(markdown, 'Trusted Vendors', warnings);
  const rawUnknownPolicy = extractSingleDirective(markdown, 'Unknown Vendor Policy', warnings);
  const rawInjection = extractSingleDirective(markdown, 'Block Indirect Prompt Injection', warnings);

  const maxAutoPay = rawMaxPay !== null ? parseStrictUsdDollar(rawMaxPay, true) : null;
  const dailyCap = rawDailyCap !== null ? parseStrictUsdDollar(rawDailyCap, true) : null;
  const maxRefund = rawMaxRefund !== null ? parseStrictUsdDollar(rawMaxRefund, true) : null;
  const creepPercent = rawCreep !== null ? parseStrictPercentage(rawCreep) : null;

  if (rawMaxPay !== null && maxAutoPay === null) warnings.push('Invalid "Max Auto-Pay" USD value.');
  if (rawDailyCap !== null && dailyCap === null) warnings.push('Invalid "Daily Spend Limit" USD value.');
  if (rawMaxRefund !== null && maxRefund === null) warnings.push('Invalid "Max Auto-Refund" USD value.');
  if (rawCreep !== null && creepPercent === null) warnings.push('Invalid "Price Creep Tolerance" percentage.');

  const allowedTools = parseStrictTools(rawTools, warnings);
  const trustedVendors = parseStrictVendors(rawVendors, warnings);
  const requireHistoricalInvoiceCheck = parseStrictBool(
    markdown,
    'Require Historical Invoice Comparison',
    warnings
  );
  const requireNonDeliveryForRefundOrDispute = parseStrictBool(
    markdown,
    'Require Non-Delivery For Refund Or Dispute',
    warnings
  );

  let unknownVendorPolicy: UnknownVendorPolicy = 'PAUSE_FOR_APPROVAL';
  if (rawUnknownPolicy === 'HARD_BLOCK' || rawUnknownPolicy === 'PAUSE_FOR_APPROVAL') {
    unknownVendorPolicy = rawUnknownPolicy;
  } else if (rawUnknownPolicy !== null) {
    warnings.push(`Invalid Unknown Vendor Policy: "${rawUnknownPolicy}".`);
  }

  let blockPromptInjection: 'STRICT' | 'WARN' = 'STRICT';
  if (rawInjection?.toLowerCase() === 'warn') {
    blockPromptInjection = 'WARN';
  } else if (rawInjection?.toLowerCase() !== 'strict') {
    warnings.push('Invalid "Block Indirect Prompt Injection" value.');
  }

  const isFailClosed =
    warnings.length > 0 ||
    maxAutoPay === null ||
    dailyCap === null ||
    maxRefund === null ||
    creepPercent === null;

  return {
    mode,
    maxAutoPayUsd: isFailClosed ? 0 : maxAutoPay,
    dailySpendCapUsd: isFailClosed ? 0 : dailyCap,
    maxAutoRefundUsd: isFailClosed ? 0 : maxRefund,
    priceCreepTolerancePercent: isFailClosed ? 0 : creepPercent,
    requireHistoricalInvoiceCheck,
    unknownVendorPolicy: isFailClosed ? 'HARD_BLOCK' : unknownVendorPolicy,
    requireNonDeliveryForRefundOrDispute,
    blockPromptInjection: isFailClosed ? 'STRICT' : blockPromptInjection,
    allowedTools: isFailClosed ? [] : allowedTools,
    trustedVendors,
    parseWarnings: warnings,
    isFailClosed
  };
}

export function serializeConstitution(policy: SpendPolicy): string {
  const vendorStr =
    policy.trustedVendors.length > 0
      ? policy.trustedVendors.map(v => `${v.name} (${v.email})`).join(', ')
      : 'none';
  const toolsStr =
    policy.allowedTools.length > 0 ? policy.allowedTools.join(', ') : 'none';

  return `# AllowAgent Spend Constitution — ${policy.mode === 'PERSONAL' ? 'Personal Wallet' : 'Business Back-Office'}
Mode: ${policy.mode}

## 1. How Much It Can Spend (Thresholds)
- Max Auto-Pay: $${policy.maxAutoPayUsd.toFixed(2)} USD
- Daily Spend Limit: $${policy.dailySpendCapUsd.toFixed(2)} USD
- Max Auto-Refund: $${policy.maxAutoRefundUsd.toFixed(2)} USD
- Price Creep Tolerance: ${policy.priceCreepTolerancePercent}%

## 2. Where It Can Spend (Allowed PayPal Tools)
- Allowed Tools: ${toolsStr}
- Require Historical Invoice Comparison: ${policy.requireHistoricalInvoiceCheck}
- Require Non-Delivery For Refund Or Dispute: ${policy.requireNonDeliveryForRefundOrDispute}

## 3. Who To Rely On (Zero-Trust Vendor Allowlist)
- Unknown Vendor Policy: ${policy.unknownVendorPolicy}
- Block Indirect Prompt Injection: ${policy.blockPromptInjection.toLowerCase()}
- Trusted Vendors: ${vendorStr}`;
}
