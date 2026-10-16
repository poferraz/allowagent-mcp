import { describe, it, expect } from 'vitest';
import { SCENARIO_DECK, getScenariosByMode } from '../../src/simulator/scenarios';
import { runScenarioById } from '../../src/simulator/runner';
import { StatefulLedgerClient } from '../../src/paypal/ledger-client';
import {
  PERSONAL_CONSTITUTION_MD,
  BUSINESS_CONSTITUTION_MD
} from '../../src/constitution/presets';

describe('6-Scenario Red-Team & Safe Execution Deck (Pure Previews)', () => {
  it('exposes 3 PERSONAL scenarios and 3 BUSINESS scenarios', () => {
    expect(SCENARIO_DECK).toHaveLength(6);
    expect(getScenariosByMode('PERSONAL')).toHaveLength(3);
    expect(getScenariosByMode('BUSINESS')).toHaveLength(3);
  });

  it('produces exact expected verdicts across all 3 PERSONAL scenarios without mutating ledger spend on preview', () => {
    const ledger = new StatefulLedgerClient();
    expect(ledger.getRolling24hSpendUsd()).toBe(42);

    const p1 = runScenarioById('P1', PERSONAL_CONSTITUTION_MD, ledger);
    expect(p1.evaluation.verdict).toBe('AUTO_EXECUTE');
    expect(p1.evaluation.executionStatus).toBe('NOT_EXECUTED');
    expect(ledger.getRolling24hSpendUsd()).toBe(42);

    const p2 = runScenarioById('P2', PERSONAL_CONSTITUTION_MD, ledger);
    expect(p2.evaluation.verdict).toBe('PAUSE_FOR_APPROVAL');
    expect(p2.evaluation.diffCard?.verifiedBaselineUsd).toBe(150);

    const p3 = runScenarioById('P3', PERSONAL_CONSTITUTION_MD, ledger);
    expect(p3.evaluation.verdict).toBe('HARD_BLOCK');
    expect(ledger.getRolling24hSpendUsd()).toBe(42);
  });

  it('produces exact expected verdicts across all 3 BUSINESS scenarios without mutating refund state on preview', () => {
    const ledger = new StatefulLedgerClient();

    const b1 = runScenarioById('B1', BUSINESS_CONSTITUTION_MD, ledger);
    expect(b1.evaluation.verdict).toBe('AUTO_EXECUTE');
    expect(b1.evaluation.executionStatus).toBe('NOT_EXECUTED');
    expect(ledger.hasPriorRefund('ORD-901')).toBe(false);

    const b2 = runScenarioById('B2', BUSINESS_CONSTITUTION_MD, ledger);
    expect(b2.evaluation.verdict).toBe('HARD_BLOCK');

    const b3 = runScenarioById('B3', BUSINESS_CONSTITUTION_MD, ledger);
    expect(b3.evaluation.verdict).toBe('PAUSE_FOR_APPROVAL');
  });
});
