import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateAgentProposal } from '../../src/agent/agent-client';

describe('Autonomous AI Agent — Financial Tool Calling & Intent Reasoning', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('generates a record_payment_for_invoice tool call using local reasoner when no API key provided', async () => {
    const prompt = "Please pay Sarah's Eco Cleaning invoice INV2-SARAH-104 for $185.00";
    const proposal = await generateAgentProposal(prompt);

    expect(proposal.modelUsed).toContain('local-financial-reasoner');
    expect(proposal.toolCall.toolName).toBe('record_payment_for_invoice');
    expect(proposal.toolCall.args.invoiceId).toBe('INV2-SARAH-104');
    expect(proposal.toolCall.args.amountUsd).toBe(185);
    expect(proposal.toolCall.args.recipientEmail).toBe('billing@saraheco.ca');
    expect(proposal.rationale).toContain('invoice');
  });

  it('generates a create_refund tool call for delayed package refund', async () => {
    const prompt = 'Process a $24 refund for customer order ORD-772 due to transit delay';
    const proposal = await generateAgentProposal(prompt);

    expect(proposal.toolCall.toolName).toBe('create_refund');
    expect(proposal.toolCall.args.orderId).toBe('ORD-772');
    expect(proposal.toolCall.args.amountUsd).toBe(24);
    expect(proposal.rationale).toContain('refund');
  });

  it('generates a pay_order tool call for utility bills', async () => {
    const prompt = 'Pay monthly Metro Fiber internet bill of $28.00 for order ORD-101 invoice INV2-METRO-01';
    const proposal = await generateAgentProposal(prompt);

    expect(proposal.toolCall.toolName).toBe('pay_order');
    expect(proposal.toolCall.args.orderId).toBe('ORD-101');
    expect(proposal.toolCall.args.amountUsd).toBe(28);
    expect(proposal.toolCall.args.recipientEmail).toBe('autopay@metrofiber.com');
  });

  it('calls live OpenAI endpoint with structured function calling when OpenAI key is provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'I will record this invoice payment.',
              tool_calls: [
                {
                  id: 'call_openai_991',
                  type: 'function',
                  function: {
                    name: 'record_payment_for_invoice',
                    arguments: JSON.stringify({
                      invoiceId: 'INV2-SARAH-104',
                      recipientName: "Sarah's Eco Cleaning",
                      recipientEmail: 'billing@saraheco.ca',
                      amountUsd: 185
                    })
                  }
                }
              ]
            }
          }
        ]
      })
    });

    const proposal = await generateAgentProposal(
      "Pay Sarah's Eco Cleaning invoice INV2-SARAH-104 for $185.00",
      { provider: 'openai', apiKey: 'sk-test-mock-key' }
    );

    expect(proposal.modelUsed).toContain('gpt-4o');
    expect(proposal.toolCall.toolName).toBe('record_payment_for_invoice');
    expect(proposal.toolCall.args.amountUsd).toBe(185);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test-mock-key'
        })
      })
    );
  });

  it('calls Groq endpoint when Groq key is provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Groq function call',
              tool_calls: [
                {
                  id: 'call_groq_1',
                  type: 'function',
                  function: {
                    name: 'create_refund',
                    arguments: JSON.stringify({ orderId: 'ORD-772', amountUsd: 24 })
                  }
                }
              ]
            }
          }
        ]
      })
    });

    const proposal = await generateAgentProposal('Refund $24 for ORD-772', {
      provider: 'groq',
      apiKey: 'gsk_mock_groq_key'
    });

    expect(proposal.modelUsed).toContain('llama');
    expect(proposal.toolCall.toolName).toBe('create_refund');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer gsk_mock_groq_key'
        })
      })
    );
  });

  it('calls Ollama endpoint when provider is ollama', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Ollama model reasoning',
              tool_calls: [
                {
                  id: 'call_ollama_1',
                  type: 'function',
                  function: {
                    name: 'pay_order',
                    arguments: JSON.stringify({ orderId: 'ORD-101', amountUsd: 28 })
                  }
                }
              ]
            }
          }
        ]
      })
    });

    const proposal = await generateAgentProposal('Pay $28 for ORD-101', {
      provider: 'ollama',
      modelName: 'mistral-large-4:cloud',
      baseUrl: 'http://localhost:11434/v1'
    });

    expect(proposal.modelUsed).toBe('mistral-large-4:cloud');
    expect(proposal.toolCall.toolName).toBe('pay_order');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/v1/chat/completions',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('correctly handles minimal, terse, and colloquial user prompts', async () => {
    // 1. "pay cleaning invoice" (no dollar sign or explicit invoice number)
    const p1 = await generateAgentProposal('pay cleaning invoice');
    expect(p1.toolCall.toolName).toBe('record_payment_for_invoice');
    expect(p1.toolCall.args.amountUsd).toBe(185);
    expect(p1.toolCall.agentSummary).toContain("Sarah's Eco Cleaning");

    // 2. "pay the 185 invoice"
    const p2 = await generateAgentProposal('pay the 185 invoice');
    expect(p2.toolCall.toolName).toBe('record_payment_for_invoice');
    expect(p2.toolCall.args.amountUsd).toBe(185);

    // 3. "refund 24"
    const p3 = await generateAgentProposal('refund 24');
    expect(p3.toolCall.toolName).toBe('create_refund');
    expect(p3.toolCall.args.amountUsd).toBe(24);

    // 4. "cancel gym subscription"
    const p4 = await generateAgentProposal('cancel gym subscription');
    expect(p4.toolCall.toolName).toBe('cancel_subscription');
  });

  it('correctly parses comma-formatted amounts without numeric truncation', async () => {
    const proposal = await generateAgentProposal('Please process refund for order ORD-772 of $1,250.00');
    expect(proposal.toolCall.args.amountUsd).toBe(1250);
  });
});

