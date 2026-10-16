import React, { useEffect, useState } from 'react';
import { Bot, RefreshCw, Send, Sparkles } from 'lucide-react';
import { generateAgentProposal, type AgentConfig, type AgentProposal } from '../../agent/agent-client';
import type { ConstitutionMode } from '../../types/constitution';
import type { McpToolCall } from '../../types/mcp';

export interface AgentPromptBarProps {
  onProposeToolCall: (call: McpToolCall, proposal: AgentProposal) => void;
  agentConfig?: AgentConfig;
  mode?: ConstitutionMode;
}

export const AgentPromptBar: React.FC<AgentPromptBarProps> = ({ onProposeToolCall, agentConfig, mode = 'PERSONAL' }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastProposal, setLastProposal] = useState<AgentProposal | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) { setElapsed(0); return; }
    const start = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - start) / 1000), 100);
    return () => clearInterval(timer);
  }, [isLoading]);

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

  const suggestions = mode === 'PERSONAL' ? [
    { label: "Pay Sarah's invoice $185", text: "Pay Sarah's Eco Cleaning invoice for $185" },
    { label: 'Pay cleaning invoice', text: 'Pay cleaning invoice' },
    { label: 'Pay internet bill $28', text: 'Pay Metro Fiber internet bill for $28' },
    { label: 'Cancel gym subscription', text: 'Cancel gym subscription' }
  ] : [
    { label: 'Refund customer $24', text: 'Refund $24 to customer on ORD-772 for delayed delivery' },
    { label: 'Settle dispute $320', text: 'Accept dispute claim on DSP-3301 for $320' },
    { label: 'Pay vendor bill $28', text: 'Pay Metro Fiber vendor invoice for $28' },
    { label: 'Pay the 185 invoice', text: 'Pay the 185 invoice' }
  ];

  const providerLabel = agentConfig?.provider === 'openai' ? 'OpenAI GPT-4o'
    : agentConfig?.provider === 'gemini' ? 'Gemini 2.5'
    : agentConfig?.provider === 'groq' ? 'Groq (Llama 3.3)'
    : agentConfig?.provider === 'ollama' ? `Ollama: ${agentConfig.modelName || 'mistral-large-4:cloud'}`
    : 'Local Reasoner';

  return (
    <div className="agent-prompt-section">
      <div className="agent-card">
        <div className="agent-card-header">
          <div className="agent-title-group">
            <div className="agent-icon-badge"><Bot size={18} /></div>
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
              placeholder={mode === 'PERSONAL' ? "e.g. Pay cleaning invoice, or pay $28 internet bill..." : "e.g. Refund $24 on ORD-772, or accept dispute DSP-3301..."}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>
          <button type="submit" className="agent-submit-btn" disabled={isLoading || !prompt.trim()}>
            {isLoading ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
            <span>Ask Assistant</span>
          </button>
        </form>

        <div className="agent-suggestions-row">
          <span className="agent-suggestions-label">Try asking:</span>
          {suggestions.map((s, idx) => (
            <button key={idx} type="button" className="agent-chip" onClick={() => { setPrompt(s.text); handleSubmit(undefined, s.text); }}>
              {s.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(0,112,224,0.06)', borderRadius: '8px', border: '1px solid rgba(0,112,224,0.2)', marginTop: '10px' }}>
            <RefreshCw size={15} className="spin" style={{ color: '#0070E0' }} />
            <span style={{ fontSize: '0.8125rem', color: '#001C48', fontWeight: 500 }}>
              {elapsed < 1.2 ? 'Understanding payment request...' : elapsed < 2.5 ? 'Verifying invoice & ledger with PayPal Sandbox...' : 'Synthesizing payment proposal...'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#68717A', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
              {elapsed.toFixed(1)}s
            </span>
          </div>
        )}

        {lastProposal && !isLoading && (
          <div className="agent-proposal-card">
            <div className="agent-proposal-content">
              <div className="agent-proposal-avatar"><Sparkles size={18} /></div>
              <div className="agent-proposal-text">
                <strong>{lastProposal.toolCall.agentSummary}</strong>
                <p>{lastProposal.rationale} • Governed by AllowAgent spend firewall</p>
                {lastProposal.thinking && (
                  <details style={{ marginTop: '6px', fontSize: '0.75rem', color: '#68717A' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 500 }}>View model thinking trace</summary>
                    <div style={{ marginTop: '4px', padding: '6px 8px', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', maxHeight: '90px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                      {lastProposal.thinking}
                    </div>
                  </details>
                )}
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
