import { describe, it, expect } from 'vitest';
import { usdCents, parseStrictUsdDollar, parseStrictPercentage } from '../src/types/money';
import type { McpToolCall } from '../src/types/mcp';
import type { SpendPolicy } from '../src/types/constitution';
import type { FirewallEvaluation } from '../src/types/firewall';

describe('AllowAgent MCP Domain Contracts & Strict Money Primitives', () => {
  it('validates strict USD amounts and rejects trailing garbage, negative, or NaN values', () => {
    expect(usdCents('40.00', true)).toBe(4000);
    expect(parseStrictUsdDollar('$40.00 USD', true)).toBe(40);
    expect(parseStrictUsdDollar('$40.00garbage', true)).toBeNull();
    expect(parseStrictUsdDollar('-10.00', true)).toBeNull();
    expect(parseStrictPercentage('10%')).toBe(10);
    expect(parseStrictPercentage('.%')).toBeNull();
  });

  it('constructs valid McpToolCall and SpendPolicy objects under strict TypeScript', () => {
    const call: McpToolCall = {
      id: 'call-01',
      toolName: 'pay_order',
      agentSummary: 'Pay monthly fiber internet bill',
      args: {
        orderId: 'ORD-101',
        invoiceId: 'INV2-METRO-01',
        recipientEmail: 'autopay@metrofiber.com',
        amountUsd: 28.0
      }
    };

    const policy: SpendPolicy = {
      mode: 'PERSONAL',
      maxAutoPayUsd: 40,
      dailySpendCapUsd: 150,
      maxAutoRefundUsd: 25,
      priceCreepTolerancePercent: 10,
      requireHistoricalInvoiceCheck: true,
      unknownVendorPolicy: 'PAUSE_FOR_APPROVAL',
      requireNonDeliveryForRefundOrDispute: true,
      blockPromptInjection: 'STRICT',
      allowedTools: ['pay_order', 'record_payment_for_invoice'],
      trustedVendors: [{ name: 'Metro Fiber', email: 'autopay@metrofiber.com' }],
      parseWarnings: [],
      isFailClosed: false
    };

    const evaluation: Partial<FirewallEvaluation> = {
      verdict: 'AUTO_EXECUTE',
      executionStatus: 'NOT_EXECUTED',
      triggeredRule: 'Within Max Auto-Pay ($40.00 USD)'
    };

    expect(call.toolName).toBe('pay_order');
    expect(policy.unknownVendorPolicy).toBe('PAUSE_FOR_APPROVAL');
    expect(evaluation.executionStatus).toBe('NOT_EXECUTED');
  });
});
