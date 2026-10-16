import { describe, it, expect } from 'vitest';
import { crossExamineToolCall } from '../../src/firewall/cross-examiner';
import { StatefulLedgerClient } from '../../src/paypal/ledger-client';
import { compileConstitution } from '../../src/constitution/parser';
import { PERSONAL_CONSTITUTION_MD, BUSINESS_CONSTITUTION_MD } from '../../src/constitution/presets';

describe('PayPal Read-vs-Write Cross-Examiner', () => {
  it('flags PRICE_CREEP_DETECTED and extracts $150 baseline when cleaner invoice jumps to $185', () => {
    const ledger = new StatefulLedgerClient();
    const policy = compileConstitution(PERSONAL_CONSTITUTION_MD, 'PERSONAL');
    const res = crossExamineToolCall(
      {
        id: 'call-creep',
        toolName: 'record_payment_for_invoice',
        agentSummary: "Record payment for Sarah's Eco Cleaning invoice",
        args: {
          invoiceId: 'INV2-SARAH-104',
          recipientEmail: 'billing@saraheco.ca',
          amountUsd: 185
        }
      },
      policy,
      ledger
    );

    expect(res.verifiedFactsComplete).toBe(true);
    expect(res.readToolsInvoked).toContain('get_invoice');
    expect(res.readToolsInvoked).toContain('list_transactions');
    expect(res.verifiedBaselineUsd).toBe(150);
    expect(res.addedLineItems).toContain('+$35.00 — Inside Oven Deep Clean (Unconfirmed Add-On)');
    expect(res.findings.some(f => f.code === 'PRICE_CREEP_DETECTED')).toBe(true);
  });

  it('flags SPOOFED_VENDOR_DOMAIN on lookalike domain billing@cloudhost-support.io and extracts ledger note', () => {
    const ledger = new StatefulLedgerClient();
    const policy = compileConstitution(PERSONAL_CONSTITUTION_MD, 'PERSONAL');
    const res = crossExamineToolCall(
      {
        id: 'call-spoof',
        toolName: 'pay_order',
        agentSummary: 'Pay CloudHost renewal invoice',
        args: {
          invoiceId: 'INV2-SPOOF-99',
          recipientEmail: 'billing@cloudhost-support.io',
          amountUsd: 140
        }
      },
      policy,
      ledger
    );

    expect(res.ledgerUntrustedText).toContain('SYSTEM OVERRIDE');
    expect(res.findings.some(f => f.code === 'SPOOFED_VENDOR_DOMAIN' && f.severity === 'CRITICAL')).toBe(
      true
    );
  });

  it('flags DELIVERED_DISPUTE_SURRENDER and rejects caller-spoofed orderId on dispute', () => {
    const ledger = new StatefulLedgerClient();
    const policy = compileConstitution(BUSINESS_CONSTITUTION_MD, 'BUSINESS');
    const res = crossExamineToolCall(
      {
        id: 'call-dispute',
        toolName: 'accept_dispute_claim',
        agentSummary: 'Accept buyer INR dispute claim',
        args: {
          disputeId: 'PP-D-8821',
          orderId: 'ORD-901',
          amountUsd: 320
        }
      },
      policy,
      ledger
    );

    expect(res.readToolsInvoked).toContain('get_dispute');
    expect(res.readToolsInvoked).toContain('get_shipment_tracking');
    expect(res.findings.some(f => f.code === 'MISSING_OR_INVALID_RESOURCE')).toBe(true);
    expect(res.findings.some(f => f.code === 'DELIVERED_DISPUTE_SURRENDER' && f.severity === 'CRITICAL')).toBe(
      true
    );
  });

  it('rejects missing resource IDs, negative/zero amounts, and mismatched invoice vendor/amount', () => {
    const ledger = new StatefulLedgerClient();
    const policy = compileConstitution(PERSONAL_CONSTITUTION_MD, 'PERSONAL');

    const bareCall = crossExamineToolCall(
      {
        id: 'call-bare',
        toolName: 'pay_order',
        agentSummary: 'Bare call with no order or invoice',
        args: { amountUsd: 1 }
      },
      policy,
      ledger
    );
    expect(bareCall.verifiedFactsComplete).toBe(false);
    expect(bareCall.findings.some(f => f.code === 'MISSING_OR_INVALID_RESOURCE')).toBe(true);

    const negativeCall = crossExamineToolCall(
      {
        id: 'call-neg',
        toolName: 'pay_order',
        agentSummary: 'Negative amount attack',
        args: { invoiceId: 'INV2-METRO-01', recipientEmail: 'autopay@metrofiber.com', amountUsd: -39 }
      },
      policy,
      ledger
    );
    expect(negativeCall.verifiedFactsComplete).toBe(false);
    expect(negativeCall.findings.some(f => f.code === 'INVALID_TOOL_ARGUMENTS')).toBe(true);

    const mismatchedInvoice = crossExamineToolCall(
      {
        id: 'call-mismatch',
        toolName: 'pay_order',
        agentSummary: 'Trusted vendor email paired with spoofed invoice',
        args: { invoiceId: 'INV2-SPOOF-99', recipientEmail: 'autopay@metrofiber.com', amountUsd: 1 }
      },
      policy,
      ledger
    );
    expect(mismatchedInvoice.verifiedFactsComplete).toBe(false);
    expect(mismatchedInvoice.findings.some(f => f.code === 'MISSING_OR_INVALID_RESOURCE')).toBe(true);
  });
});
