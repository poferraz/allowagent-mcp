import React from 'react';
import type { ApprovalAction } from '../../firewall/approval-gate';
import type { FirewallEvaluation } from '../../types/firewall';

export interface ApprovalDiffModalProps {
  evaluation: FirewallEvaluation;
  onDecision: (action: ApprovalAction) => void;
  onClose: () => void;
}

export const ApprovalDiffModal: React.FC<ApprovalDiffModalProps> = ({
  evaluation,
  onDecision,
  onClose
}) => {
  const diff = evaluation.diffCard;
  if (!diff) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.02rem' }}>
            Constitutional Hold: Human-in-the-Loop Evidence Diff
          </h3>
          <span className="badge badge-amber">{diff.payloadHash}</span>
        </div>

        <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1' }}>{diff.summary}</p>

        <div className="stage-box" style={{ display: 'grid', gap: '6px', fontSize: '0.82rem' }}>
          <div>
            Proposed MCP Write Amount:{' '}
            <strong style={{ color: '#f59e0b' }}>${diff.proposedAmountUsd.toFixed(2)} USD</strong>
          </div>
          {typeof diff.verifiedBaselineUsd === 'number' && (
            <div>
              PayPal 3-Month Verified Baseline:{' '}
              <strong style={{ color: '#10b981' }}>
                ${diff.verifiedBaselineUsd.toFixed(2)} USD
              </strong>
            </div>
          )}
          {diff.addedLineItems.map(item => (
            <div key={item} style={{ color: '#f87171' }}>
              Unapproved Line Item Delta: <strong>{item}</strong>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-red"
            onClick={() => onDecision('REJECT')}
          >
            Reject Call
          </button>
          {diff.canAmendToBaseline && typeof diff.verifiedBaselineUsd === 'number' && (
            <button
              type="button"
              className="btn btn-green"
              onClick={() => onDecision('AMEND_TO_BASELINE')}
            >
              Amend & Pay Verified Baseline (${diff.verifiedBaselineUsd.toFixed(2)})
            </button>
          )}
          <button
            type="button"
            className="btn btn-amber"
            onClick={() => onDecision('APPROVE_FULL')}
          >
            Approve Full Amount (${diff.proposedAmountUsd.toFixed(2)})
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
