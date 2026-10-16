import React from 'react';
import { Check, ShieldCheck, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import type { FirewallEvaluation } from '../../types/firewall';
import type { SpendPolicy } from '../../types/constitution';
import { FINDING_LABELS, money, TOOL_LABELS } from '../presentation';
import { HelpTip } from './HelpTip';

export interface FirewallTracePaneProps {
  evaluation: FirewallEvaluation;
  policy: SpendPolicy;
  onExecuteAuto: () => void;
  onOpenApprovalModal: () => void;
}

export const FirewallTracePane: React.FC<FirewallTracePaneProps> = ({ evaluation: e, policy, onExecuteAuto, onOpenApprovalModal }) => {
  const done = e.executionStatus === 'EXECUTED_FULL' || e.executionStatus === 'EXECUTED_BASELINE_AMENDED';
  const rejected = e.executionStatus === 'REJECTED_BY_HUMAN';
  const ready = e.verdict === 'AUTO_EXECUTE';
  const blocked = e.verdict === 'HARD_BLOCK';
  const refund = e.call.toolName === 'create_refund';
  const recording = e.call.toolName === 'record_payment_for_invoice';
  const noun = refund ? 'Refund' : recording ? 'Invoice payment' : 'Payment';
  const status = done ? `${noun} ${recording ? 'recorded' : 'completed'}` : rejected ? `${noun} declined`
    : blocked ? `${noun} blocked` : ready ? refund ? 'Ready to refund' : recording ? 'Ready to record' : 'Ready to pay' : 'Needs your review';
  const tone = done || (ready && !rejected) ? 'green' : blocked || rejected ? 'red' : 'amber';
  const Icon = tone === 'green' ? ShieldCheck : tone === 'red' ? ShieldAlert : Clock;
  const ruleFindings = e.crossExam.findings.filter(f => ['TOOL_NOT_IN_CONSTITUTION', 'MAX_AUTOPAY_EXCEEDED', 'DAILY_CAP_EXCEEDED', 'PRICE_CREEP_DETECTED', 'NEW_UNVERIFIED_VENDOR'].includes(f.code));
  const checks = [
    { label: 'Payment details', passed: !e.crossExam.findings.some(f => f.code === 'INVALID_TOOL_ARGUMENTS' || f.code === 'MISSING_OR_INVALID_RESOURCE'), detail: 'The request has a valid amount and supported payment details.' },
    { label: 'Message safety', passed: !e.injectionScan.detected, detail: e.injectionScan.detected ? 'The message contains instructions that try to change your rules.' : 'No configured suspicious instruction patterns were detected. Other checks still apply.' },
    { label: 'Account records', passed: e.crossExam.verifiedFactsComplete && !e.crossExam.findings.some(f => f.severity === 'CRITICAL' && f.code !== 'TOOL_NOT_IN_CONSTITUTION'), detail: 'Compare the request with the available demo invoices, orders, and payment history.' },
    { label: 'Spending rules', passed: !policy.isFailClosed && ruleFindings.length === 0, detail: policy.isFailClosed ? 'Your payment rules need to be corrected before automatic payments can continue.' : 'Check your permitted actions, recipients, and spending limits.' }
  ];
  const reason = policy.isFailClosed ? 'Your payment rules need attention. Correct them in Payment settings.'
    : e.injectionScan.detected ? 'The message includes instructions to bypass your payment rules.'
    : e.crossExam.findings[0] ? FINDING_LABELS[e.crossExam.findings[0].code]
    : 'The account records match and the request is within your payment limits.';
  return <section className="pane review-pane" aria-labelledby="review-title">
    <div className="pane-header"><h2 id="review-title">Payment review</h2>
      <HelpTip label="payment review">This is a preview until you choose an action below. All transactions in this demo use sample account records.</HelpTip>
    </div>
    <div className="payment-summary">
      <div className="recipient-avatar" aria-hidden="true">{refund ? 'RF' : (e.call.args.recipientName || 'Account').split(' ').slice(0, 2).map(s => s[0]).join('')}</div>
      <div className="recipient"><h3>{e.call.args.recipientName || (refund ? `Refund for ${e.call.args.orderId}` : `Request for ${e.call.args.orderId || e.call.args.disputeId || e.call.args.subscriptionId || 'account'}`)}</h3>
        <p>{e.call.args.recipientEmail || e.call.args.reason || TOOL_LABELS[e.call.toolName]}</p></div>
      <div className="payment-amount">{money(e.executedAmountUsd ?? e.call.args.amountUsd)}<span>USD</span></div>
    </div>
    <div className={`decision decision-${tone}`} role="status" aria-live="polite">
      <Icon size={23} aria-hidden="true" /><div><h3>{status}</h3>
        <p>{done ? 'The demo account has been updated. No real money moved.' : rejected ? 'You declined this request. The demo account was not charged.' : reason}</p></div>
    </div>
    {typeof e.crossExam.verifiedBaselineUsd === 'number' && <div className="comparison-row">
      <span>Usual amount <HelpTip label="usual amount">The historical invoice average in this demo. It may differ from the amount due.</HelpTip></span>
      <strong>{money(e.crossExam.verifiedBaselineUsd)}</strong>
      {typeof e.call.args.amountUsd === 'number' && e.call.args.amountUsd > e.crossExam.verifiedBaselineUsd && <span className="difference">+{money(e.call.args.amountUsd - e.crossExam.verifiedBaselineUsd)} this time</span>}
    </div>}
    <div className="checks-list">
      {checks.map(check => <div className="check-row" key={check.label} aria-label={`${check.label}: ${check.passed ? 'Passed' : 'Needs attention'}`}>
        <span className={check.passed ? 'check-pass' : 'check-attention'}>{check.passed ? <Check size={16} /> : <Clock size={16} />}</span>
        <span>{check.label}</span><HelpTip label={check.label.toLowerCase()}>{check.detail}</HelpTip>
        <span className={`check-status ${check.passed ? '' : 'needs-attention'}`}>{check.passed ? 'Passed' : 'Needs attention'}</span>
      </div>)}
    </div>
    <div className="review-actions">
      {ready && e.executionStatus === 'NOT_EXECUTED' && <button type="button" className="btn" onClick={onExecuteAuto}
        title="Apply this verified action to the demo account. No real money moves.">
        {refund ? 'Refund' : recording ? 'Record payment of' : 'Pay'} {money(e.call.args.amountUsd)}<ArrowRight size={17} />
      </button>}
      {e.verdict === 'PAUSE_FOR_APPROVAL' && e.executionStatus === 'PAUSED' && <button type="button" className="btn" onClick={onOpenApprovalModal}
        title="Compare the requested amount with the account records, then approve, adjust, or decline it.">Review payment<ArrowRight size={17} /></button>}
      {!done && !rejected && <span className="muted">{blocked ? 'This request cannot proceed.' : 'No money has moved.'}</span>}
    </div>
    <details className="technical-details"><summary>View supporting details</summary>
      {e.crossExam.findings.map((f, i) => <div className="evidence" key={`${f.code}-${i}`}><strong>{FINDING_LABELS[f.code]}</strong>
        <p>Requested: {f.agentClaim}</p><p>Account record: {f.ledgerFact}</p></div>)}
      <h3>Account records checked</h3><ul>{e.crossExam.ledgerCitations.map(c => <li key={c}>{c}</li>)}</ul>
      <h3>Message supplied with the request</h3><p>{e.call.untrustedContext || 'No message supplied.'}</p>
      <details><summary>Developer details</summary><p>Action: <code>{e.call.toolName}</code></p>
        <p>Decision: <code>{e.verdict}</code> · State: <code>{e.executionStatus}</code></p>
        <p>{e.triggeredRule}</p><p>Read tools: <code>{e.crossExam.readToolsInvoked.join(', ') || 'None'}</code></p>
        <p>Request reference: <code>{e.payloadHash}</code></p><pre className="code-box">{JSON.stringify(e.call.args, null, 2)}</pre>
        {e.injectionScan.flaggedQuotes.map(q => <blockquote key={q}>{q}</blockquote>)}
      </details>
    </details>
  </section>;
};
