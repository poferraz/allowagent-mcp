import type { McpToolCall } from '../types/mcp';
import { PAYPAL_AGENT_TOOLS } from './toolkit-schemas';

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
}

function extractAmount(text: string): number {
  const m = text.match(/\$\s*(\d+(\.\d{1,2})?)/) || text.match(/(\d+(\.\d{1,2})?)\s*(dollars|usd)/i);
  return m ? parseFloat(m[1]) : 0;
}

export function runLocalReasoner(prompt: string): AgentProposal {
  const amount = extractAmount(prompt);
  const lower = prompt.toLowerCase();
  const idMatch = prompt.match(/\b(INV2-[A-Z0-9-]+|ORD-[A-Z0-9-]+|DSP-[A-Z0-9-]+|SUB-[A-Z0-9-]+)\b/i);
  const resourceId = idMatch ? idMatch[1].toUpperCase() : '';

  if (lower.includes('refund')) {
    const orderId = resourceId || 'ORD-772';
    return {
      toolCall: {
        id: `agent-${Date.now()}`,
        toolName: 'create_refund',
        agentSummary: `Process refund of $${(amount || 24).toFixed(2)} for ${orderId}`,
        args: { orderId, amountUsd: amount || 24, reason: prompt }
      },
      rationale: `Identified refund request for order ${orderId} ($${(amount || 24).toFixed(2)}).`,
      modelUsed: 'local-financial-reasoner-v1',
      confidence: 0.96
    };
  }

  if (lower.includes('dispute')) {
    const disputeId = resourceId || 'DSP-3301';
    return {
      toolCall: {
        id: `agent-${Date.now()}`,
        toolName: 'accept_dispute_claim',
        agentSummary: `Accept dispute claim ${disputeId} for $${(amount || 320).toFixed(2)}`,
        args: { disputeId, amountUsd: amount || 320, reason: prompt }
      },
      rationale: `Identified dispute surrender request for ${disputeId}.`,
      modelUsed: 'local-financial-reasoner-v1',
      confidence: 0.94
    };
  }

  if (lower.includes('clean') || lower.includes('sarah') || (resourceId && resourceId.startsWith('INV2-SARAH'))) {
    const invoiceId = resourceId || 'INV2-SARAH-104';
    return {
      toolCall: {
        id: `agent-${Date.now()}`,
        toolName: 'record_payment_for_invoice',
        agentSummary: `Record payment for Sarah's Eco Cleaning ($${(amount || 185).toFixed(2)})`,
        args: {
          invoiceId,
          recipientName: "Sarah's Eco Cleaning",
          recipientEmail: 'billing@saraheco.ca',
          amountUsd: amount || 185,
          currency: 'USD'
        }
      },
      rationale: `Matched cleaning service invoice ${invoiceId} for $${(amount || 185).toFixed(2)}.`,
      modelUsed: 'local-financial-reasoner-v1',
      confidence: 0.98
    };
  }

  if (lower.includes('internet') || lower.includes('metro') || (resourceId && resourceId.startsWith('ORD-101'))) {
    return {
      toolCall: {
        id: `agent-${Date.now()}`,
        toolName: 'pay_order',
        agentSummary: `Pay Metro Fiber utility bill ($${(amount || 28).toFixed(2)})`,
        args: {
          orderId: resourceId || 'ORD-101',
          invoiceId: 'INV2-METRO-01',
          recipientName: 'Metro Fiber',
          recipientEmail: 'autopay@metrofiber.com',
          amountUsd: amount || 28,
          currency: 'USD'
        }
      },
      rationale: `Matched routine utility internet bill for Metro Fiber ($${(amount || 28).toFixed(2)}).`,
      modelUsed: 'local-financial-reasoner-v1',
      confidence: 0.99
    };
  }

  const invoiceId = resourceId.startsWith('INV') ? resourceId : 'INV2-METRO-01';
  return {
    toolCall: {
      id: `agent-${Date.now()}`,
      toolName: 'record_payment_for_invoice',
      agentSummary: `Record payment of $${(amount || 50).toFixed(2)}`,
      args: { invoiceId, recipientName: 'Merchant', recipientEmail: 'payee@paypal.com', amountUsd: amount || 50 }
    },
    rationale: `Extracted financial intent for $${(amount || 50).toFixed(2)}.`,
    modelUsed: 'local-financial-reasoner-v1',
    confidence: 0.85
  };
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
        { role: 'system', content: 'You are a PayPal financial assistant. Use tool calling to propose transactions.' },
        { role: 'user', content: prompt }
      ],
      tools: PAYPAL_AGENT_TOOLS.map(t => ({ type: 'function', function: t })),
      tool_choice: 'auto'
    })
  });
  if (!res.ok) return null;
  const data = await res.json() as { choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> } }> };
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) return null;
  return {
    toolCall: { id: `call-${Date.now()}`, toolName: tc.function.name as McpToolCall['toolName'], agentSummary: prompt, args: JSON.parse(tc.function.arguments) },
    rationale: data.choices?.[0]?.message?.content || `${model} generated tool call ${tc.function.name}.`,
    modelUsed: model,
    confidence: 0.95
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
        return {
          toolCall: { id: `call-${Date.now()}`, toolName: fc.name as McpToolCall['toolName'], agentSummary: prompt, args: fc.args as unknown as McpToolCall['args'] },
          rationale: `Gemini 2.5 Flash identified tool call ${fc.name}.`,
          modelUsed: 'gemini-2.5-flash',
          confidence: 0.95
        };
      }
    }
  }

  return runLocalReasoner(prompt);
}
