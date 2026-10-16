import React, { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { generateAgentProposal, type AgentConfig, type AgentProposal } from '../../agent/agent-client';
import type { McpToolCall } from '../../types/mcp';

export interface AgentPromptBarProps {
  onProposeToolCall: (call: McpToolCall, proposal: AgentProposal) => void;
  agentConfig?: AgentConfig;
}

export const AgentPromptBar: React.FC<AgentPromptBarProps> = ({ onProposeToolCall, agentConfig }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastProposal, setLastProposal] = useState<AgentProposal | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = customText ?? prompt;
    if (!textToSubmit.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const proposal = await generateAgentProposal(textToSubmit, agentConfig);
      setLastProposal(proposal);
      onProposeToolCall(proposal.toolCall, proposal);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { label: "Pay Sarah's invoice $185", text: "Pay Sarah's Eco Cleaning invoice INV2-SARAH-104 for $185" },
    { label: 'Pay internet bill $28', text: 'Auto-pay Metro Fiber internet bill ORD-101 for $28' },
    { label: 'Refund delay $24', text: 'Refund $24 to customer for delayed delivery on ORD-772' },
    { label: 'Dispute claim $320', text: 'Surrender $320 on dispute DSP-3301' }
  ];

  return (
    <div className="agent-prompt-box" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="#0070E0" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>AI Payment Assistant</span>
          <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
            {agentConfig?.provider === 'openai' ? 'OpenAI GPT-4o' : agentConfig?.provider === 'gemini' ? 'Gemini 2.5' : 'Local Reasoner'}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#64748B' }}>Prompt AI to generate a payment action</span>
      </div>

      <form onSubmit={e => handleSubmit(e)} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="e.g. Pay Sarah's Eco Cleaning invoice for $185, or Refund $24 on ORD-772..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
        />
        <button
          type="submit"
          className="primary-button"
          disabled={isLoading || !prompt.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', fontSize: '13px' }}
        >
          {isLoading ? <Sparkles size={16} className="spin" /> : <Send size={16} />}
          <span>Ask Agent</span>
        </button>
      </form>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#64748B' }}>Suggestions:</span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="secondary-button"
            style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            onClick={() => { setPrompt(s.text); handleSubmit(undefined, s.text); }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {lastProposal && (
        <div style={{ marginTop: '12px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #0070E0', fontSize: '12px' }}>
          <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '2px' }}>
            Agent Action: <code>{lastProposal.toolCall.toolName}</code> (${lastProposal.toolCall.args.amountUsd})
          </div>
          <div style={{ color: '#475569' }}>{lastProposal.rationale}</div>
        </div>
      )}
    </div>
  );
};
