import React, { useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { ApprovalAction } from '../../firewall/approval-gate';
import type { FirewallEvaluation } from '../../types/firewall';
import { FINDING_LABELS, money } from '../presentation';
import { HelpTip } from './HelpTip';

export interface ApprovalDiffModalProps {
  evaluation: FirewallEvaluation;
  onDecision: (action: ApprovalAction) => void;
  onClose: () => void;
}

export const ApprovalDiffModal: React.FC<ApprovalDiffModalProps> = ({ evaluation, onDecision, onClose }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  const diff = evaluation.diffCard;
  if (!diff) return null;
  const recording = evaluation.call.toolName === 'record_payment_for_invoice';
  return <dialog ref={ref} className="modal-card" aria-labelledby="approval-title" aria-describedby="approval-description"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="modal-heading"><h2 id="approval-title">A closer look before you approve</h2>
      <button type="button" className="icon-button" onClick={onClose} aria-label="Close review" title="Go back without approving. The request stays paused."><X size={21} /></button></div>
    <p id="approval-description">{evaluation.call.args.recipientName || 'This request'} needs your approval. The demo account has not been charged.</p>
    <div className="approval-amount"><span>Requested amount</span><strong>{money(diff.proposedAmountUsd)} <small>USD</small></strong></div>
    {typeof diff.verifiedBaselineUsd === 'number' && <div className="comparison-row"><span>Usual amount
      <HelpTip label="usual invoice amount">The historical average stored on this invoice in the demo account.</HelpTip></span>
      <strong>{money(diff.verifiedBaselineUsd)}</strong></div>}
    <div className="approval-reasons"><h3>What needs your attention</h3>
      <ul>{evaluation.crossExam.findings.map((f, i) => <li key={`${f.code}-${i}`}>{FINDING_LABELS[f.code]}</li>)}</ul>
      {diff.addedLineItems.length > 0 && <><h3>Extra items on this invoice</h3><ul>{diff.addedLineItems.map(item => <li key={item}>{item}</li>)}</ul></>}
    </div>
    <p className="field-note">{recording ? 'Approving records an invoice payment in the demo account.' : 'Approving applies this action to the demo account.'} No real money moves.</p>
    <div className="modal-actions">
      {diff.canAmendToBaseline && typeof diff.verifiedBaselineUsd === 'number' && <button type="button" className="btn"
        title="Use the verified historical amount instead of the requested amount in the demo account."
        onClick={() => onDecision('AMEND_TO_BASELINE')}>Use usual amount · {money(diff.verifiedBaselineUsd)}<ArrowRight size={16} /></button>}
      <button type="button" className={`btn ${diff.canAmendToBaseline ? 'btn-secondary' : ''}`}
        title="Approve the full requested amount once, including any extra charges. Your payment settings stay as they are."
        onClick={() => onDecision('APPROVE_FULL')}>Approve {money(diff.proposedAmountUsd)}</button>
      <button type="button" className="text-button danger-text" title="Decline this request. No payment will be applied to the demo account."
        onClick={() => onDecision('REJECT')}>Decline request</button>
    </div>
  </dialog>;
};
