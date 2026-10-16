import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { compileConstitution } from '../../src/constitution/parser';
import { PERSONAL_CONSTITUTION_MD } from '../../src/constitution/presets';
import { evaluateToolCall } from '../../src/firewall/policy-evaluator';
import { executeAutonomousCall } from '../../src/firewall/approval-gate';
import { StatefulLedgerClient } from '../../src/paypal/ledger-client';
import { SCENARIO_DECK } from '../../src/simulator/scenarios';
import { FirewallTracePane } from '../../src/ui/components/FirewallTracePane';

describe('Customer payment review', () => {
  const policy = compileConstitution(PERSONAL_CONSTITUTION_MD, 'PERSONAL');
  const noop = () => {};

  it('does not describe invalid spending rules as passed', () => {
    const invalid = compileConstitution('', 'PERSONAL');
    const evaluation = evaluateToolCall(SCENARIO_DECK[0].call, invalid, new StatefulLedgerClient());
    const html = renderToStaticMarkup(<FirewallTracePane {...{
      evaluation, policy: invalid, onExecuteAuto: noop, onOpenApprovalModal: noop
    }} />);
    expect(html).toContain('aria-label="Spending rules: Needs attention"');
    expect(html).not.toContain('aria-label="Spending rules: Passed"');
  });

  it('distinguishes a ready preview from a completed payment and removes its execution action', () => {
    const ledger = new StatefulLedgerClient();
    const preview = evaluateToolCall(SCENARIO_DECK[0].call, policy, ledger);
    const render = (evaluation: typeof preview) => renderToStaticMarkup(<FirewallTracePane {...{
      evaluation, policy, onExecuteAuto: noop, onOpenApprovalModal: noop
    }} />);
    expect(render(preview)).toContain('Ready to pay');
    expect(render(preview)).toContain('Pay $28.00');
    const completed = render(executeAutonomousCall(preview, ledger));
    expect(completed).toContain('Payment completed');
    expect(completed).not.toContain('Pay $28.00');
  });

  it('never offers a payment action for a blocked example', () => {
    const evaluation = evaluateToolCall(SCENARIO_DECK[2].call, policy, new StatefulLedgerClient());
    const html = renderToStaticMarkup(<FirewallTracePane {...{
      evaluation, policy, onExecuteAuto: noop, onOpenApprovalModal: noop
    }} />);
    expect(html).toContain('Payment blocked');
    expect(html).not.toContain('Pay $140.00');
    expect(html).not.toContain('Review payment');
  });
});
