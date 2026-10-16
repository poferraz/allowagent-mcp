import React, { useState } from 'react';
import { Bot, RefreshCw, Send, Sparkles } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = customText ?? prompt;
    if (!textToSubmit.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const proposal = await generateAgentProposal(textToSubmit, agentConfig);
      setLastProposal(proposal);
      onProposeToolCall(proposal.toolCall, proposal);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
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

  const providerLabel =
    agentConfig?.provider === 'openai'
      ? 'OpenAI GPT-4o'
      : agentConfig?.provider === 'gemini'
        ? 'Gemini 2.5'
        : agentConfig?.provider === 'groq'
          ? 'Groq (Llama 3.3)'
          : agentConfig?.provider === 'ollama'
            ? `Ollama: ${agentConfig.modelName || 'mistral-large-4:cloud'}`
            : 'Local Reasoner';

  return (
    <div className="agent-prompt-section">
      <div className="agent-card">
        <div className="agent-card-header">
          <div className="agent-title-group">
            <div className="agent-icon-badge">
              <Bot size={18} />
            </div>
            <h2 className="agent-title">AI Payment Assistant</h2>
            <span className="agent-provider-pill">{providerLabel}</span>
          </div>
          <span className="agent-hint">Ask your assistant to pay a bill, record an invoice, or issue a refund</span>
        </div>

        <form className="agent-input-row" onSubmit={e => handleSubmit(e)}>
          <div className="agent-input-wrapper">
            <Sparkles size={18} className="agent-input-icon" />
            <input
              type="text"
              className="agent-input"
              placeholder="e.g. Pay Sarah's Eco Cleaning invoice for $185, or refund $24 on ORD-772..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="agent-submit-btn"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
            <span>Ask Assistant</span>
          </button>
        </form>

        <div className="agent-suggestions-row">
          <span className="agent-suggestions-label">Try asking:</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="agent-chip"
              onClick={() => {
                setPrompt(s.text);
                handleSubmit(undefined, s.text);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {lastProposal && (
          <div className="agent-proposal-card">
            <div className="agent-proposal-content">
              <div className="agent-proposal-avatar">
                <Sparkles size={18} />
              </div>
              <div className="agent-proposal-text">
                <strong>Proposed: {lastProposal.toolCall.agentSummary}</strong>
                <p>{lastProposal.rationale} • Reviewed below by AllowAgent firewall</p>
              </div>
            </div>
            <div className="agent-proposal-amount">
              <strong>{typeof lastProposal.toolCall.args.amountUsd === 'number' ? `$${lastProposal.toolCall.args.amountUsd.toFixed(2)}` : 'Action'}</strong>
              <span>{lastProposal.toolCall.args.currency || 'USD'}</span>
            </div>
          </div>
        )}
        {errorMsg && (
          <div style={{ padding: '8px 12px', background: 'rgba(217,45,32,0.08)', border: '1px solid #D92D20', borderRadius: '8px', color: '#D92D20', fontSize: '0.8125rem', marginTop: '10px' }}>
            ⚠️ {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
