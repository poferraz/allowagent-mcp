import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, KeyRound, X } from 'lucide-react';
import { LivePayPalClient } from '../../paypal/live-client';
import { loadPersistedSettings, savePersistedSettings } from '../storage';

export interface ConnectionSettings {
  paypalClientId: string;
  paypalClientSecret: string;
  aiProvider: 'local' | 'openai' | 'gemini' | 'groq' | 'ollama';
  aiApiKey: string;
  aiModel?: string;
  ollamaEndpoint?: string;
}

export interface ConnectionModalProps {
  settings: ConnectionSettings;
  onSave: (settings: ConnectionSettings) => void;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ settings, onSave, onClose }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<ConnectionSettings>(() => ({
    ...loadPersistedSettings(),
    ...settings
  }));
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

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    savePersistedSettings(draft);
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
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
      </div>

      <p className="field-note" style={{ marginTop: '10px', marginBottom: '18px' }}>
        Configure credentials for PayPal Sandbox or connect an AI model (Ollama, Groq, Gemini, OpenAI).
      </p>

      <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>PayPal Sandbox Client ID</label>
          <input
            type="text"
            placeholder="e.g. A21AA..."
            value={draft.paypalClientId ?? ''}
            onChange={e => setDraft({ ...draft, paypalClientId: e.target.value })}
            style={{ width: '100%', minHeight: '40px', padding: '8px 12px', border: '1px solid #A4AFBB', borderRadius: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>PayPal Sandbox Client Secret</label>
          <input
            type="password"
            placeholder="e.g. E..."
            value={draft.paypalClientSecret ?? ''}
            onChange={e => setDraft({ ...draft, paypalClientSecret: e.target.value })}
            style={{ width: '100%', minHeight: '40px', padding: '8px 12px', border: '1px solid #A4AFBB', borderRadius: '8px' }}
          />
          <div style={{ marginTop: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="text-button"
              disabled={testing || !draft.paypalClientId || !draft.paypalClientSecret}
              onClick={handleTestConnection}
            >
              {testing ? 'Testing connection...' : 'Test PayPal Connection'}
            </button>
            {testResult && (
              <span style={{ fontSize: '0.75rem', color: testResult.ok ? 'var(--green)' : 'var(--red)' }}>{testResult.message}</span>
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2px 0' }} />

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>AI Model / Connector</label>
          <select
            value={draft.aiProvider}
            onChange={e => setDraft({ ...draft, aiProvider: e.target.value as ConnectionSettings['aiProvider'] })}
            style={{ width: '100%', minHeight: '40px', padding: '8px 12px', border: '1px solid #A4AFBB', borderRadius: '8px', background: '#FFF' }}
          >
            <option value="local">Built-in Financial Reasoner (Zero-Key Local Agent)</option>
            <option value="ollama">Ollama (Cloud & Local: Mistral, DeepSeek, GLM)</option>
            <option value="groq">Groq Cloud (Free Llama 3.3 70B Versatile)</option>
            <option value="gemini">Google Gemini 2.5 Flash</option>
            <option value="openai">OpenAI GPT-4o-mini</option>
          </select>
        </div>

        {draft.aiProvider === 'ollama' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Model Name</label>
              <input
                type="text"
                placeholder="mistral-large-4:cloud"
                value={draft.aiModel || ''}
                onChange={e => setDraft({ ...draft, aiModel: e.target.value })}
                style={{ width: '100%', minHeight: '38px', padding: '6px 10px', border: '1px solid #A4AFBB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Ollama Base URL</label>
              <input
                type="text"
                placeholder="http://localhost:11434/v1"
                value={draft.ollamaEndpoint || ''}
                onChange={e => setDraft({ ...draft, ollamaEndpoint: e.target.value })}
                style={{ width: '100%', minHeight: '38px', padding: '6px 10px', border: '1px solid #A4AFBB', borderRadius: '8px' }}
              />
            </div>
          </div>
        )}

        {(draft.aiProvider === 'groq' || draft.aiProvider === 'gemini' || draft.aiProvider === 'openai') && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              {draft.aiProvider === 'groq' ? 'Groq API Key (gsk_...)' : draft.aiProvider === 'gemini' ? 'Gemini API Key (AIza...)' : 'OpenAI API Key (sk-...)'}
            </label>
            <input
              type="password"
              placeholder={draft.aiProvider === 'groq' ? 'gsk_...' : draft.aiProvider === 'gemini' ? 'AIza...' : 'sk-...'}
              value={draft.aiApiKey}
              onChange={e => setDraft({ ...draft, aiApiKey: e.target.value })}
              style={{ width: '100%', minHeight: '40px', padding: '8px 12px', border: '1px solid #A4AFBB', borderRadius: '8px' }}
            />
          </div>
        )}

        <div className="modal-actions" style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn" style={{ gap: '8px' }} onClick={() => handleApply()}><CheckCircle2 size={16} /> Save & Apply</button>
        </div>
      </form>
    </dialog>
  );
};
