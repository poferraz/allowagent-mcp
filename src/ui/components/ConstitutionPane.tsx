import React, { useState } from 'react';
import { AlertCircle, FileCode, RotateCcw, LockKeyhole } from 'lucide-react';
import type { SpendPolicy } from '../../types/constitution';
import { PolicyControls } from './PolicyControls';
import { HelpTip } from './HelpTip';

export interface ConstitutionPaneProps {
  markdown: string;
  onChangeMarkdown: (next: string) => void;
  onUpdatePolicy: (next: SpendPolicy) => void;
  onRestoreDefault: () => void;
  onApplyStrictVault: () => void;
  policy: SpendPolicy;
}

export const ConstitutionPane: React.FC<ConstitutionPaneProps> = props => {
  const { markdown, onChangeMarkdown, onUpdatePolicy, onRestoreDefault, onApplyStrictVault, policy } = props;
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  return <section className="pane settings-pane" aria-labelledby="settings-title">
    <div className="pane-header"><div><h2 id="settings-title">Payment settings</h2><p>You set the limits. Your assistant follows them.</p></div></div>
    <PolicyControls policy={policy} onUpdatePolicy={onUpdatePolicy} />
    {policy.parseWarnings.length > 0 && <div className="policy-alert" role="alert">
      <strong><AlertCircle size={17} /> Your rules need attention</strong>
      <p>Automatic payments are paused. Correct the rules below or restore the defaults.</p>
      <ul>{policy.parseWarnings.map(w => <li key={w}>{w}</li>)}</ul>
    </div>}
    <div className="preset-actions"><button type="button" className="text-button" onClick={onRestoreDefault}
      title="Restore the default payment limits, permitted actions, and trusted recipients for the selected account type."><RotateCcw size={14} /> Use defaults</button>
      <span><button type="button" className="text-button" onClick={onApplyStrictVault}
        title="Switch to Personal: $35 per payment, $100 per 24 hours, no automatic refunds, and block unlisted recipients."><LockKeyhole size={14} /> Stricter limits</button>
        <HelpTip label="stricter limits">Switches to Personal settings: $35 per payment, $100 per 24 hours, no automatic refunds or price increases. Unlisted recipients are blocked.</HelpTip></span>
    </div>
    <div className="advanced-settings"><button type="button" className="text-button" aria-expanded={showRawMarkdown}
      aria-controls="policy-source" onClick={() => setShowRawMarkdown(v => !v)} title="View or edit the PAYPAL.md file that stores these payment rules.">
      <FileCode size={15} /> {showRawMarkdown ? 'Hide rule file' : 'Edit rule file'}
    </button><HelpTip label="rule file">PAYPAL.md stores your payment rules as text. Editing the file also updates the controls above.</HelpTip></div>
    {showRawMarkdown && <div id="policy-source"><label className="select-label" htmlFor="constitution-source">PAYPAL.md</label>
      <textarea id="constitution-source" className="constitution-editor" value={markdown} spellCheck={false}
        onChange={e => onChangeMarkdown(e.target.value)} />
    </div>}
  </section>;
};
