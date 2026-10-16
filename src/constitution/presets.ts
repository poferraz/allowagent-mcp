import type { ConstitutionMode } from '../types/constitution';

export const PERSONAL_CONSTITUTION_MD = `# AllowAgent Spend Constitution — Personal Wallet
Mode: PERSONAL

## 1. How Much It Can Spend (Thresholds)
- Max Auto-Pay: $40.00 USD
- Daily Spend Limit: $150.00 USD
- Max Auto-Refund: $25.00 USD
- Price Creep Tolerance: 10%

## 2. Where It Can Spend (Allowed PayPal Tools)
- Allowed Tools: pay_order, record_payment_for_invoice, create_order, update_subscription, cancel_subscription
- Require Historical Invoice Comparison: true
- Require Non-Delivery For Refund Or Dispute: true

## 3. Who To Rely On (Zero-Trust Vendor Allowlist)
- Unknown Vendor Policy: PAUSE_FOR_APPROVAL
- Block Indirect Prompt Injection: strict
- Trusted Vendors: Metro Fiber (autopay@metrofiber.com), Sarah's Eco Cleaning (billing@saraheco.ca), CloudHost Inc (invoices@cloudhost.io)`;

export const STRICT_VAULT_CONSTITUTION_MD = `# AllowAgent Spend Constitution — Strict Zero-Trust Vault
Mode: PERSONAL

## 1. How Much It Can Spend (Thresholds)
- Max Auto-Pay: $35.00 USD
- Daily Spend Limit: $100.00 USD
- Max Auto-Refund: $0.00 USD
- Price Creep Tolerance: 0%

## 2. Where It Can Spend (Allowed PayPal Tools)
- Allowed Tools: pay_order, record_payment_for_invoice
- Require Historical Invoice Comparison: true
- Require Non-Delivery For Refund Or Dispute: true

## 3. Who To Rely On (Zero-Trust Vendor Allowlist)
- Unknown Vendor Policy: HARD_BLOCK
- Block Indirect Prompt Injection: strict
- Trusted Vendors: Metro Fiber (autopay@metrofiber.com), Sarah's Eco Cleaning (billing@saraheco.ca)`;

export const BUSINESS_CONSTITUTION_MD = `# AllowAgent Spend Constitution — Business Back-Office
Mode: BUSINESS

## 1. How Much It Can Spend (Thresholds)
- Max Auto-Pay: $100.00 USD
- Daily Spend Limit: $1000.00 USD
- Max Auto-Refund: $25.00 USD
- Price Creep Tolerance: 10%

## 2. Where It Can Spend (Allowed PayPal Tools)
- Allowed Tools: pay_order, record_payment_for_invoice, create_refund
- Require Historical Invoice Comparison: true
- Require Non-Delivery For Refund Or Dispute: true

## 3. Who To Rely On (Zero-Trust Vendor Allowlist)
- Unknown Vendor Policy: PAUSE_FOR_APPROVAL
- Block Indirect Prompt Injection: strict
- Trusted Vendors: Nordic Design Studio (studio@nordicdesign.io), BoxSupply Co (orders@boxsupply.com)`;

export const DEFAULT_CONSTITUTIONS: Record<ConstitutionMode, string> = {
  PERSONAL: PERSONAL_CONSTITUTION_MD,
  BUSINESS: BUSINESS_CONSTITUTION_MD
};
