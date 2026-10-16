import React, { useState } from 'react';
import type { SpendPolicy } from '../../types/constitution';
import { PolicyControls } from './PolicyControls';

export interface ConstitutionPaneProps {
  markdown: string;
  onChangeMarkdown: (next: string) => void;
  onUpdatePolicy: (next: SpendPolicy) => void;
  onRestoreDefault: () => void;
  onApplyStrictVault: () => void;
  policy: SpendPolicy;
}

export const ConstitutionPane: React.FC<ConstitutionPaneProps> = ({
  markdown,
  onChangeMarkdown,
  onUpdatePolicy,
  onRestoreDefault,
  onApplyStrictVault,
  policy
}) => {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  return (
    <section className="pane" aria-label="PAYPAL.md Constitution Pane">
      <div className="pane-header">
        <h2 className="pane-title">1. Plug & Play PAYPAL.md Constitution</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" className="btn btn-secondary" onClick={onRestoreDefault}>
            Standard Safe
          </button>
          <button type="button" className="btn btn-amber" onClick={onApplyStrictVault}>
            Strict Vault Lock
          </button>
        </div>
      </div>

      <PolicyControls policy={policy} onUpdatePolicy={onUpdatePolicy} />

      {policy.parseWarnings.length > 0 && (
        <div
          className="stage-box"
          style={{ borderColor: '#ef4444', color: '#fca5a5', fontSize: '0.74rem' }}
        >
          <strong>Fail-Closed Parser Warnings:</strong>
          {policy.parseWarnings.map(w => (
            <div key={w}>• {w}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Bi-Directional Sync with <code>PAYPAL.md</code>
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
          onClick={() => setShowRawMarkdown(s => !s)}
        >
          {showRawMarkdown ? 'Hide Raw PAYPAL.md' : 'Edit Raw PAYPAL.md'}
        </button>
      </div>

      {showRawMarkdown && (
        <textarea
          className="constitution-editor"
          value={markdown}
          onChange={e => onChangeMarkdown(e.target.value)}
          aria-label="PAYPAL.md Editor"
        />
      )}
    </section>
  );
};
