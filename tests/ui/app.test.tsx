import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../../src/ui/App';

describe('AllowAgent customer payment dashboard', () => {
  it('renders settings, examples, and a payment preview before execution', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('AllowAgent MCP');
    expect(html).toContain('PAYPAL.md');
    expect(html).toContain('Monthly internet bill');
    expect(html).toContain('An unexpected extra charge');
    expect(html).toContain('A suspicious invoice');
    expect(html).toContain('Payment review');
    expect(html).toContain('NOT_EXECUTED');
    expect(html).toContain('Pay $28.00');
  });
});
