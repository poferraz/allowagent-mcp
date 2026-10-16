import { describe, it, expect } from 'vitest';
import {
  computePayloadHash,
  executeAutonomousCall,
  resolveApprovalDecision
} from '../../src/firewall/approval-gate';
import { evaluateToolCall } from '../../src/firewall/policy-evaluator';
import { StatefulLedgerClient } from '../../src/paypal/ledger-client';
import { compileConstitution } from '../../src/constitution/parser';
import { PERSONAL_CONSTITUTION_MD } from '../../src/constitution/presets';

describe('Cryptographic Approval Gate, Tamper Re-Verification & One-Time Consumption', () => {
  it('computes deterministic payload hashes that change if any argument or baseline changes', () => {
    const h1 = computePayloadHash(
      {
        id: 'c1',
        toolName: 'pay_order',
        agentSummary: 'Pay cleaner',
        args: { invoiceId: 'INV2-SARAH-104', recipientEmail: 'billing@saraheco.ca', amountUsd: 185 }
      },
      150
    );
    const h2 = computePayloadHash(
      {
        id: 'c1',
        toolName: 'pay_order',
        agentSummary: 'Pay cleaner',
        args: { invoiceId: 'INV2-SARAH-104', recipientEmail: 'billing@saraheco.ca', amountUsd: 150 }
      },
      150
    );
    expect(h1).toMatch(/^sha256-[0-9a-f]{64}$/);
    expect(h1).not.toBe(h2);
  });

  it('enforces one-time consumption for executeAutonomousCall preventing replays', () => {
    const ledger = new StatefulLedgerClient();
    const policy = compileConstitution(PERSONAL_CONSTITUTION_MD, 'PERSONAL');
    const evaluation = evaluateToolCall(
      {
        id: 'call-auto-internet',
        toolName: 'pay_order',
        agentSummary: 'Pay monthly internet',
        args: {
          orderId: 'ORD-101',
          invoiceId: 'INV2-METRO-01',
          recipientName: 'Metro Fiber',
          recipientEmail: 'autopay@metrofiber.com',
          amountUsd: 28
        }
      },
      policy,
      ledger
    );

    expect(evaluation.verdict).toBe('AUTO_EXECUTE');
    const executed = executeAutonomousCall(evaluation, ledger);
    expect(executed.executionStatus).toBe('EXECUTED_FULL');

    // Replay attempt must throw
    expect(() => executeAutonomousCall(evaluation, ledger)).toThrow(/already consumed/i);
  });

  it('amends price-creep invoice from $185 down to $150 verified baseline and blocks replay', () => {
    const ledger = new StatefulLedgerClient();
    const policy = compileConstitution(PERSONAL_CONSTITUTION_MD, 'PERSONAL');
    const evaluation = evaluateToolCall(
      {
        id: 'call-sarah-amend',
        toolName: 'record_payment_for_invoice',
        agentSummary: "Pay Sarah's Eco Cleaning invoice",
        args: {
          invoiceId: 'INV2-SARAH-104',
          recipientName: "Sarah's Eco Cleaning",
          recipientEmail: 'billing@saraheco.ca',
          amountUsd: 185
        }
      },
      policy,
      ledger
    );

    expect(evaluation.verdict).toBe('PAUSE_FOR_APPROVAL');
    expect(evaluation.diffCard?.canAmendToBaseline).toBe(true);
    expect(evaluation.diffCard?.verifiedBaselineUsd).toBe(150);
    expect(ledger.getRolling24hSpendUsd()).toBe(42);

    const resolved = resolveApprovalDecision(
      evaluation,
      'AMEND_TO_BASELINE',
      ledger,
      evaluation.payloadHash
    );

    expect(resolved.executionStatus).toBe('EXECUTED_BASELINE_AMENDED');
    expect(resolved.executedAmountUsd).toBe(150);
    expect(ledger.getRolling24hSpendUsd()).toBe(192);

    expect(() =>
      resolveApprovalDecision(evaluation, 'APPROVE_FULL', ledger, evaluation.payloadHash)
    ).toThrow(/already consumed/i);
  });

  it('recomputes payloadHash at execution time and rejects post-pause argument or baseline tampering', () => {
    const ledger = new StatefulLedgerClient();
    const policy = compileConstitution(PERSONAL_CONSTITUTION_MD, 'PERSONAL');
    const evaluation = evaluateToolCall(
      {
        id: 'call-sarah-tamper',
        toolName: 'record_payment_for_invoice',
        agentSummary: "Pay Sarah's Eco Cleaning invoice",
        args: {
          invoiceId: 'INV2-SARAH-104',
          recipientEmail: 'billing@saraheco.ca',
          amountUsd: 185
        }
      },
      policy,
      ledger
    );

    evaluation.call.args.amountUsd = 999;
    evaluation.call.args.recipientEmail = 'evil@example.com';

    expect(() =>
      resolveApprovalDecision(evaluation, 'APPROVE_FULL', ledger, evaluation.payloadHash)
    ).toThrow(/Payload hash mismatch/);
    expect(ledger.getRolling24hSpendUsd()).toBe(42);
  });
});
