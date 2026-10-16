import type { McpToolCall } from '../types/mcp';
import { PAYPAL_AGENT_TOOLS } from './toolkit-schemas';
import { runLocalReasoner } from './local-reasoner';

export { runLocalReasoner };

export interface AgentConfig {
  provider?: 'local' | 'openai' | 'gemini' | 'groq' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
}

export interface AgentProposal {
  toolCall: McpToolCall;
  rationale: string;
  modelUsed: string;
  confidence: number;
  thinking?: string;
}

function cleanHumanSummary(toolName: string, args: Record<string, unknown>, prompt: string): string {
  const amt = typeof args.amountUsd === 'number' ? `$${args.amountUsd.toFixed(2)}` : '';
  if (toolName === 'record_payment_for_invoice') {
    const name = (args.recipientName as string) || "Sarah's Eco Cleaning";
    return `Pay ${name} invoice ${amt}`.trim();
  }
  if (toolName === 'pay_order') {
    const name = (args.recipientName as string) || 'Metro Fiber';
    return `Pay ${name} ${amt}`.trim();
  }
  if (toolName === 'create_refund') {
    return `Refund order ${args.orderId || 'ORD-772'} ${amt}`.trim();
  }
  if (toolName === 'accept_dispute_claim') {
    return `Accept dispute ${args.disputeId || 'DSP-3301'} ${amt}`.trim();
  }
  if (toolName === 'cancel_subscription') {
    return `Cancel subscription ${args.subscriptionId || 'SUB-GYM-01'}`.trim();
  }
  return prompt;
}

async function callOpenAiCompatible(prompt: string, endpoint: string, model: string, apiKey?: string): Promise<AgentProposal | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(`${endpoint.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a PayPal financial assistant. Use tool calling to propose transactions concisely.' },
        { role: 'user', content: prompt }
      ],
      tools: PAYPAL_AGENT_TOOLS.map(t => ({ type: 'function', function: t })),
      tool_choice: 'auto'
    })
  });
  if (!res.ok) return null;
  const data = await res.json() as { choices?: Array<{ message?: { content?: string; reasoning?: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> } }> };
  const choice = data.choices?.[0]?.message;
  const tc = choice?.tool_calls?.[0];
  if (!tc) {
    if (choice?.content && /(cannot|can't|refuse|sorry|blocked|not allowed|safety)/i.test(choice.content)) {
      throw new Error(`${model} refused: ${choice.content}`);
    }
    return null;
  }
  const args = JSON.parse(tc.function.arguments || '{}');
  if (typeof args.amountUsd === 'string') args.amountUsd = parseFloat(args.amountUsd);
  else if (args.amountUsd === undefined && args.amount !== undefined) args.amountUsd = Number(args.amount);

  const toolName = tc.function.name as McpToolCall['toolName'];
  const summary = cleanHumanSummary(toolName, args, prompt);
  const reasoning = choice?.reasoning;
  const rationale = choice?.reasoning || choice?.content || `Parsed payment intent for ${summary}.`;

  return {
    toolCall: { id: `call-${Date.now()}`, toolName, agentSummary: summary, args },
    rationale,
    modelUsed: model,
    confidence: 0.95,
    thinking: reasoning
  };
}

export async function generateAgentProposal(prompt: string, config?: AgentConfig): Promise<AgentProposal> {
  const provider = config?.provider ?? (config?.apiKey?.startsWith('gsk_') ? 'groq' : config?.apiKey?.startsWith('AIza') ? 'gemini' : config?.apiKey ? 'openai' : 'local');

  if (provider === 'openai' && config?.apiKey) {
    const res = await callOpenAiCompatible(prompt, 'https://api.openai.com/v1', config.modelName ?? 'gpt-4o-mini', config.apiKey);
    if (res) return res;
  }

  if (provider === 'groq' && config?.apiKey) {
    const res = await callOpenAiCompatible(prompt, 'https://api.groq.com/openai/v1', config.modelName ?? 'llama-3.3-70b-versatile', config.apiKey);
    if (res) return res;
  }

  if (provider === 'ollama') {
    const endpoint = config?.baseUrl || 'http://localhost:11434/v1';
    const res = await callOpenAiCompatible(prompt, endpoint, config?.modelName ?? 'mistral-large-4:cloud', config?.apiKey);
    if (res) return res;
  }

  if (provider === 'gemini' && config?.apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ functionDeclarations: PAYPAL_AGENT_TOOLS }] })
    });
    if (res.ok) {
      const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ functionCall?: { name: string; args: Record<string, unknown> } }> } }> };
      const fc = data.candidates?.[0]?.content?.parts?.find(p => p.functionCall)?.functionCall;
      if (fc) {
        const toolName = fc.name as McpToolCall['toolName'];
        const summary = cleanHumanSummary(toolName, fc.args as Record<string, unknown>, prompt);
        return {
          toolCall: { id: `call-${Date.now()}`, toolName, agentSummary: summary, args: fc.args as unknown as McpToolCall['args'] },
          rationale: `Parsed payment intent for ${summary}.`,
          modelUsed: 'gemini-2.5-flash',
          confidence: 0.95
        };
      }
    }
  }

  return runLocalReasoner(prompt);
}
