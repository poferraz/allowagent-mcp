import { describe, it, expect } from 'vitest';
import {
  compileConstitution,
  serializeConstitution
} from '../../src/constitution/parser';
import {
  PERSONAL_CONSTITUTION_MD,
  BUSINESS_CONSTITUTION_MD,
  STRICT_VAULT_CONSTITUTION_MD
} from '../../src/constitution/presets';

describe('PAYPAL.md Spend Constitution Compiler & Strict Directive Validator', () => {
  it('compiles the Personal Wallet constitution preset accurately', () => {
    const policy = compileConstitution(PERSONAL_CONSTITUTION_MD, 'PERSONAL');
    expect(policy.mode).toBe('PERSONAL');
    expect(policy.isFailClosed).toBe(false);
    expect(policy.maxAutoPayUsd).toBe(40);
    expect(policy.dailySpendCapUsd).toBe(150);
    expect(policy.maxAutoRefundUsd).toBe(25);
    expect(policy.priceCreepTolerancePercent).toBe(10);
    expect(policy.unknownVendorPolicy).toBe('PAUSE_FOR_APPROVAL');
    expect(policy.allowedTools).toEqual([
      'pay_order',
      'record_payment_for_invoice',
      'create_order',
      'update_subscription',
      'cancel_subscription'
    ]);
    expect(policy.trustedVendors).toEqual(
      expect.arrayContaining([
        { name: "Sarah's Eco Cleaning", email: 'billing@saraheco.ca' },
        { name: 'Metro Fiber', email: 'autopay@metrofiber.com' }
      ])
    );
  });

  it('compiles the Business Back-Office preset with accept_dispute_claim disabled by default', () => {
    const policy = compileConstitution(BUSINESS_CONSTITUTION_MD, 'BUSINESS');
    expect(policy.mode).toBe('BUSINESS');
    expect(policy.isFailClosed).toBe(false);
    expect(policy.allowedTools).not.toContain('accept_dispute_claim');
  });

  it('compiles the Strict Vault Lock preset with HARD_BLOCK on unknown vendors', () => {
    const policy = compileConstitution(STRICT_VAULT_CONSTITUTION_MD, 'PERSONAL');
    expect(policy.isFailClosed).toBe(false);
    expect(policy.unknownVendorPolicy).toBe('HARD_BLOCK');
    expect(policy.priceCreepTolerancePercent).toBe(0);
  });

  it('round-trips visual control edits through serializeConstitution -> compileConstitution', () => {
    const initial = compileConstitution(BUSINESS_CONSTITUTION_MD, 'BUSINESS');
    const updatedMarkdown = serializeConstitution({
      ...initial,
      maxAutoPayUsd: 250,
      unknownVendorPolicy: 'HARD_BLOCK',
      allowedTools: ['create_refund']
    });
    const recompiled = compileConstitution(updatedMarkdown, 'BUSINESS');
    expect(recompiled.isFailClosed).toBe(false);
    expect(recompiled.maxAutoPayUsd).toBe(250);
    expect(recompiled.unknownVendorPolicy).toBe('HARD_BLOCK');
    expect(recompiled.allowedTools).toEqual(['create_refund']);
  });

  it('fails closed ($0 limits and [] tools) on missing Allowed Tools, $40.00garbage, .%, or duplicate directives', () => {
    const missingTools = PERSONAL_CONSTITUTION_MD.replace(/- Allowed Tools:[^\n]+\n/, '');
    const p1 = compileConstitution(missingTools, 'PERSONAL');
    expect(p1.isFailClosed).toBe(true);
    expect(p1.allowedTools).toEqual([]);
    expect(p1.maxAutoPayUsd).toBe(0);

    const trailingGarbage = PERSONAL_CONSTITUTION_MD.replace('$40.00 USD', '$40.00garbage');
    const p2 = compileConstitution(trailingGarbage, 'PERSONAL');
    expect(p2.isFailClosed).toBe(true);
    expect(p2.maxAutoPayUsd).toBe(0);

    const badPercent = PERSONAL_CONSTITUTION_MD.replace('10%', '.%');
    const p3 = compileConstitution(badPercent, 'PERSONAL');
    expect(p3.isFailClosed).toBe(true);
    expect(p3.priceCreepTolerancePercent).toBe(0);

    const duplicateCap = `${PERSONAL_CONSTITUTION_MD}\n- Max Auto-Pay: $999.00 USD`;
    const p4 = compileConstitution(duplicateCap, 'PERSONAL');
    expect(p4.isFailClosed).toBe(true);
    expect(p4.maxAutoPayUsd).toBe(0);
  });
});
