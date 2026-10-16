import React, { useState } from 'react';
import { ALL_WRITE_TOOLS } from '../../constitution/directives';
import type { SpendPolicy } from '../../types/constitution';
import type { PayPalMcpWriteTool } from '../../types/mcp';

const TOOL_LABELS: Record<PayPalMcpWriteTool, string> = {
  pay_order: 'Pay Orders',
  record_payment_for_invoice: 'Pay Invoices',
  create_refund: 'Issue Refunds',
  accept_dispute_claim: 'Surrender Disputes',
  update_subscription: 'Update Subscriptions',
  create_order: 'Create Orders',
  cancel_subscription: 'Cancel Subscriptions'
};

const SLIDER_FIELDS: {
  key: 'maxAutoPayUsd' | 'dailySpendCapUsd' | 'maxAutoRefundUsd' | 'priceCreepTolerancePercent';
  label: string;
  max: number;
  step: number;
  unit: '$' | '%';
}[] = [
  { key: 'maxAutoPayUsd', label: 'Max Auto-Pay', max: 250, step: 5, unit: '$' },
  { key: 'dailySpendCapUsd', label: '24h Spend Cap', max: 1000, step: 25, unit: '$' },
  { key: 'maxAutoRefundUsd', label: 'Max Auto-Refund', max: 100, step: 5, unit: '$' },
  { key: 'priceCreepTolerancePercent', label: 'Price Creep Limit', max: 30, step: 5, unit: '%' }
];

export interface PolicyControlsProps {
  policy: SpendPolicy;
  onUpdatePolicy: (next: SpendPolicy) => void;
}

export const PolicyControls: React.FC<PolicyControlsProps> = ({ policy, onUpdatePolicy }) => {
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');

  const toggleTool = (tool: PayPalMcpWriteTool) => {
    const exists = policy.allowedTools.includes(tool);
    const allowedTools = exists
      ? policy.allowedTools.filter(t => t !== tool)
      : [...policy.allowedTools, tool];
    onUpdatePolicy({ ...policy, allowedTools });
  };

  const removeVendor = (email: string) => {
    onUpdatePolicy({
      ...policy,
      trustedVendors: policy.trustedVendors.filter(v => v.email !== email)
    });
  };

  const handleAddVendor = () => {
    const name = newVendorName.trim();
    const email = newVendorEmail.trim().toLowerCase();
    if (!name || !email.includes('@') || policy.trustedVendors.some(v => v.email === email)) return;
    onUpdatePolicy({ ...policy, trustedVendors: [...policy.trustedVendors, { name, email }] });
    setNewVendorName('');
    setNewVendorEmail('');
  };

  return (
    <div className="stage-box" style={{ display: 'grid', gap: '10px', fontSize: '0.78rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {SLIDER_FIELDS.map(({ key, label, max, step, unit }) => (
          <label key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{label}</strong>
              <span>{unit === '$' ? `$${policy[key].toFixed(0)}` : `${policy[key]}%`}</span>
            </div>
            <input
              type="range"
              min={0}
              max={max}
              step={step}
              value={policy[key]}
              onChange={e => onUpdatePolicy({ ...policy, [key]: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </label>
        ))}
      </div>

      <div>
        <strong style={{ display: 'block', marginBottom: '6px' }}>
          Where It Can Spend (Allowed PayPal MCP Tools):
        </strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {ALL_WRITE_TOOLS.map(tool => {
            const active = policy.allowedTools.includes(tool);
            return (
              <button
                key={tool}
                type="button"
                className={`btn ${active ? 'btn-green' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                onClick={() => toggleTool(tool)}
              >
                {active ? '✓ ' : '✕ '}
                {TOOL_LABELS[tool]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <strong>Who To Rely On ({policy.trustedVendors.length} Trusted Payees):</strong>
          <button
            type="button"
            className={`btn ${policy.unknownVendorPolicy === 'HARD_BLOCK' ? 'btn-red' : 'btn-secondary'}`}
            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
            onClick={() =>
              onUpdatePolicy({
                ...policy,
                unknownVendorPolicy:
                  policy.unknownVendorPolicy === 'HARD_BLOCK' ? 'PAUSE_FOR_APPROVAL' : 'HARD_BLOCK'
              })
            }
          >
            Unlisted Vendors: {policy.unknownVendorPolicy}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {policy.trustedVendors.map(v => (
            <span
              key={v.email}
              className="badge badge-info"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'none' }}
            >
              {v.name} ({v.email})
              <button
                type="button"
                onClick={() => removeVendor(v.email)}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder="Vendor name"
            value={newVendorName}
            onChange={e => setNewVendorName(e.target.value)}
            style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: '1px solid #334155', background: '#090e1d', color: '#f1f5f9', fontSize: '0.74rem' }}
          />
          <input
            type="email"
            placeholder="billing@vendor.com"
            value={newVendorEmail}
            onChange={e => setNewVendorEmail(e.target.value)}
            style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: '1px solid #334155', background: '#090e1d', color: '#f1f5f9', fontSize: '0.74rem' }}
          />
          <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={handleAddVendor}>
            + Trust
          </button>
        </div>
      </div>
    </div>
  );
};
