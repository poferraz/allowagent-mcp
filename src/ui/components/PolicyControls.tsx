import React, { useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { ALL_WRITE_TOOLS } from '../../constitution/directives';
import type { SpendPolicy } from '../../types/constitution';
import type { PayPalMcpWriteTool } from '../../types/mcp';
import { TOOL_LABELS, money } from '../presentation';
import { HelpTip } from './HelpTip';

const LIMITS = [
  { key: 'maxAutoPayUsd', label: 'Automatic payment limit', max: 250, step: 5, help: 'The most your assistant can pay per request without asking you. Other checks still apply.' },
  { key: 'dailySpendCapUsd', label: 'Spending limit for 24 hours', max: 1000, step: 25, help: 'Requests that take demo payment spending above this limit need your review.' },
  { key: 'maxAutoRefundUsd', label: 'Automatic refund limit', max: 100, step: 5, help: 'The most your assistant can refund per request without asking you.' },
  { key: 'priceCreepTolerancePercent', label: 'Price increase limit', max: 30, step: 5, help: 'Ask for review when an invoice rises by more than this percentage above its historical average.' }
] as const;

export interface PolicyControlsProps {
  policy: SpendPolicy;
  onUpdatePolicy: (next: SpendPolicy) => void;
}

export const PolicyControls: React.FC<PolicyControlsProps> = ({ policy, onUpdatePolicy }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const toggleTool = (tool: PayPalMcpWriteTool) => onUpdatePolicy({ ...policy,
    allowedTools: policy.allowedTools.includes(tool) ? policy.allowedTools.filter(t => t !== tool) : [...policy.allowedTools, tool]
  });
  const addRecipient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (policy.trustedVendors.some(v => v.email === normalized)) {
      setError('This email address is already on your trusted list.'); return;
    }
    onUpdatePolicy({ ...policy, trustedVendors: [...policy.trustedVendors, { name: name.trim(), email: normalized }] });
    setName(''); setEmail(''); setError('');
  };
  return <>
    <fieldset className="limits"><legend>Spending limits</legend>
      {LIMITS.map(({ key, label, max, step, help }) => <div className="limit-control" key={key}>
        <div className="limit-label"><label htmlFor={key}>{label}</label><HelpTip label={label.toLowerCase()}>{help}</HelpTip></div>
        <div className="limit-input"><input id={key} type="range" min={0} max={Math.max(max, policy[key])} step={step}
          value={policy[key]} aria-valuetext={key === 'priceCreepTolerancePercent' ? `${policy[key]} percent` : `${money(policy[key])} USD`}
          onChange={e => onUpdatePolicy({ ...policy, [key]: Number(e.target.value) })} />
          <output htmlFor={key}>{key === 'priceCreepTolerancePercent' ? `${policy[key]}%` : money(policy[key])}</output></div>
      </div>)}
      <p className="field-note">All amounts are in USD. Changes apply to the preview immediately.</p>
    </fieldset>
    <details className="settings-section"><summary>Permitted actions <span>{policy.allowedTools.length} enabled</span></summary>
      <p className="field-note">Choose what your assistant can do. Spending limits and record checks still apply.</p>
      <div className="tool-list">{ALL_WRITE_TOOLS.map(tool => {
        const active = policy.allowedTools.includes(tool);
        return <button key={tool} type="button" className="tool-toggle" aria-pressed={active}
          title={`${active ? 'Disable' : 'Enable'} ${TOOL_LABELS[tool].toLowerCase()} for your assistant`}
          onClick={() => toggleTool(tool)}><span>{TOOL_LABELS[tool]}</span><span className={`switch ${active ? 'on' : ''}`}><Check size={11} /></span></button>;
      })}</div>
    </details>
    <details className="settings-section" open><summary>Trusted recipients <span>{policy.trustedVendors.length} saved</span></summary>
      <p className="field-note">Your assistant still checks every request from these recipients.</p>
      <ul className="recipient-list">{policy.trustedVendors.map(v => <li key={v.email}>
        <div><strong>{v.name}</strong><span>{v.email}</span></div>
        <button type="button" className="icon-button" aria-label={`Remove ${v.name}`} title={`Remove ${v.name} from your trusted recipients`}
          onClick={() => onUpdatePolicy({ ...policy, trustedVendors: policy.trustedVendors.filter(item => item.email !== v.email) })}><X size={16} /></button>
      </li>)}</ul>
      <label className="select-label" htmlFor="new-recipient-policy">For other recipients</label>
      <select id="new-recipient-policy" value={policy.unknownVendorPolicy}
        onChange={e => onUpdatePolicy({ ...policy, unknownVendorPolicy: e.target.value as SpendPolicy['unknownVendorPolicy'] })}>
        <option value="PAUSE_FOR_APPROVAL">Ask me to review</option><option value="HARD_BLOCK">Block the request</option>
      </select>
      <details className="add-recipient"><summary><Plus size={15} /> Add a trusted recipient</summary>
        <form onSubmit={addRecipient} className="recipient-form">
          <label htmlFor="recipient-name">Recipient name</label><input required id="recipient-name" value={name} onChange={e => setName(e.target.value)} />
          <label htmlFor="recipient-email">Email address</label><input required type="email" id="recipient-email" value={email} onChange={e => setEmail(e.target.value)} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-secondary" disabled={!name.trim() || !email.trim()} title="Add this recipient to your trusted list. All payment checks still apply.">Add recipient</button>
        </form>
      </details>
    </details>
  </>;
};
