import React, { useState } from 'react';
import { CheckCircle2, KeyRound, X } from 'lucide-react';
import { LivePayPalClient } from '../../paypal/live-client';

export interface ConnectionSettings {
  paypalClientId: string;
  paypalClientSecret: string;
  aiProvider: 'local' | 'openai' | 'gemini';
  aiApiKey: string;
}

export interface ConnectionModalProps {
  settings: ConnectionSettings;
  onSave: (settings: ConnectionSettings) => void;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ settings, onSave, onClose }) => {
  const [draft, setDraft] = useState<ConnectionSettings>({ ...settings });
  const [testResult, setTestResult] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const client = new LivePayPalClient({
        clientId: draft.paypalClientId,
        clientSecret: draft.paypalClientSecret
      });
      const res = await client.testConnection();
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : String(err) });
    } finally {
      setTesting(false);
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draft);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="#0070E0" />
            <h2 id="settings-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>PayPal & AI Settings</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </header>

        <form onSubmit={handleApply} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              PayPal Sandbox Client ID
            </label>
            <input
              type="text"
              placeholder="e.g. A21AA..."
              value={draft.paypalClientId}
              onChange={e => setDraft({ ...draft, paypalClientId: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              PayPal Sandbox Client Secret
            </label>
            <input
              type="password"
              placeholder="e.g. E..."
              value={draft.paypalClientSecret}
              onChange={e => setDraft({ ...draft, paypalClientSecret: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
            />
            <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                disabled={testing || !draft.paypalClientId || !draft.paypalClientSecret}
                onClick={handleTestConnection}
              >
                {testing ? 'Testing...' : 'Test PayPal Connection'}
              </button>
              {testResult && (
                <span style={{ fontSize: '12px', color: testResult.ok ? '#059669' : '#DC2626' }}>
                  {testResult.message}
                </span>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              AI Model / Reasoner
            </label>
            <select
              value={draft.aiProvider}
              onChange={e => setDraft({ ...draft, aiProvider: e.target.value as ConnectionSettings['aiProvider'] })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', background: '#FFF' }}
            >
              <option value="local">Built-in Financial Reasoner (Zero-Key Local Agent)</option>
              <option value="gemini">Google Gemini 2.5 Flash (Live Function Calling)</option>
              <option value="openai">OpenAI GPT-4o-mini (Live Tool Calling)</option>
            </select>
          </div>

          {draft.aiProvider !== 'local' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                {draft.aiProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
              </label>
              <input
                type="password"
                placeholder={draft.aiProvider === 'gemini' ? 'AIza...' : 'sk-...'}
                value={draft.aiApiKey}
                onChange={e => setDraft({ ...draft, aiApiKey: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Save & Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
