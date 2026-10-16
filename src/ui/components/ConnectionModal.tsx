import React, { useEffect, useRef, useState } from 'react';
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
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<ConnectionSettings>({ ...settings });
  const [testResult, setTestResult] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

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
    <dialog
      ref={ref}
      className="modal-card"
      style={{ maxWidth: '500px' }}
      aria-labelledby="settings-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
    >
      <div className="modal-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <KeyRound size={22} color="#0070E0" />
          <h2 id="settings-title">PayPal & AI Settings</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>

      <p className="field-note" style={{ marginTop: '10px', marginBottom: '18px' }}>
        Configure credentials to connect to live PayPal Sandbox or switch AI agent models.
      </p>

      <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
            PayPal Sandbox Client ID
          </label>
          <input
            type="text"
            placeholder="e.g. A21AA..."
            value={draft.paypalClientId}
            onChange={e => setDraft({ ...draft, paypalClientId: e.target.value })}
            style={{ width: '100%', minHeight: '44px', padding: '10px 14px', border: '1px solid #A4AFBB', borderRadius: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
            PayPal Sandbox Client Secret
          </label>
          <input
            type="password"
            placeholder="e.g. E..."
            value={draft.paypalClientSecret}
            onChange={e => setDraft({ ...draft, paypalClientSecret: e.target.value })}
            style={{ width: '100%', minHeight: '44px', padding: '10px 14px', border: '1px solid #A4AFBB', borderRadius: '8px' }}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="text-button"
              disabled={testing || !draft.paypalClientId || !draft.paypalClientSecret}
              onClick={handleTestConnection}
            >
              {testing ? 'Testing connection...' : 'Test PayPal Connection'}
            </button>
            {testResult && (
              <span style={{ fontSize: '0.75rem', color: testResult.ok ? 'var(--green)' : 'var(--red)' }}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
            AI Assistant Model
          </label>
          <select
            value={draft.aiProvider}
            onChange={e => setDraft({ ...draft, aiProvider: e.target.value as ConnectionSettings['aiProvider'] })}
            style={{ width: '100%', minHeight: '44px', padding: '10px 14px', border: '1px solid #A4AFBB', borderRadius: '8px', background: '#FFF' }}
          >
            <option value="local">Built-in Financial Reasoner (Zero-Key Local Agent)</option>
            <option value="gemini">Google Gemini 2.5 Flash (Live Function Calling)</option>
            <option value="openai">OpenAI GPT-4o-mini (Live Tool Calling)</option>
          </select>
        </div>

        {draft.aiProvider !== 'local' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              {draft.aiProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
            </label>
            <input
              type="password"
              placeholder={draft.aiProvider === 'gemini' ? 'AIza...' : 'sk-...'}
              value={draft.aiApiKey}
              onChange={e => setDraft({ ...draft, aiApiKey: e.target.value })}
              style={{ width: '100%', minHeight: '44px', padding: '10px 14px', border: '1px solid #A4AFBB', borderRadius: '8px' }}
            />
          </div>
        )}

        <div className="modal-actions" style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" style={{ gap: '8px' }}>
            <CheckCircle2 size={16} /> Save & Apply
          </button>
        </div>
      </form>
    </dialog>
  );
};
