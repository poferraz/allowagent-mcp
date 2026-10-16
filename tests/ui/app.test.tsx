import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../../src/ui/App';

describe('AllowAgent MCP 3-Pane Command Center UI', () => {
  it('renders TopTelemetryBar, ConstitutionPane, PolicyControls, SimulatorPane, and pure preview FirewallTracePane', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('AllowAgent MCP');
    expect(html).toContain('PAYPAL.md');
    expect(html).toContain('P1: Routine Utility Bill ($28.00)');
    expect(html).toContain('P2: Cleaner Invoice Creep ($185 vs. $150 Avg)');
    expect(html).toContain('P3: Spoofed Vendor + Prompt Injection ($140.00)');
    expect(html).toContain('4-Stage Firewall Cross-Examination Trace');
    expect(html).toContain('NOT_EXECUTED');
    expect(html).toContain('Execute Verified Call on PayPal Ledger');
  });
});
