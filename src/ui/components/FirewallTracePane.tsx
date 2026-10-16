import React from 'react';
import type { FirewallEvaluation } from '../../types/firewall';

export interface FirewallTracePaneProps {
  evaluation: FirewallEvaluation;
  onExecuteAuto: () => void;
  onOpenApprovalModal: () => void;
}

export const FirewallTracePane: React.FC<FirewallTracePaneProps> = ({
  evaluation,
  onExecuteAuto,
  onOpenApprovalModal
}) => {
  const verdictBadge =
    evaluation.verdict === 'AUTO_EXECUTE'
      ? 'badge-green'
      : evaluation.verdict === 'PAUSE_FOR_APPROVAL'
      ? 'badge-amber'
      : 'badge-red';

  return (
    <section className="pane" aria-label="4-Stage Firewall Cross-Examination Trace">
      <div className="pane-header">
        <h2 className="pane-title">3. 4-Stage Firewall Cross-Examination Trace</h2>
        <span className={`badge ${verdictBadge}`}>{evaluation.verdict}</span>
      </div>

      <div className="stage-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '0.84rem' }}>{evaluation.triggeredRule}</strong>
          <code style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{evaluation.payloadHash}</code>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '6px' }}>
          Status: <strong>{evaluation.executionStatus}</strong>
          {typeof evaluation.executedAmountUsd === 'number' && (
            <span> (${evaluation.executedAmountUsd.toFixed(2)} USD settled on PayPal Ledger)</span>
          )}
        </div>
      </div>

      <div className="stage-box">
        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
          Stage 2: 3-Vector Taint & Prompt Injection Scanner
        </div>
        <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
          {evaluation.injectionScan.explanation}
        </div>
        {evaluation.injectionScan.flaggedQuotes.map(q => (
          <div
            key={q}
            style={{
              marginTop: '6px',
              padding: '6px 8px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderLeft: '3px solid #ef4444',
              fontSize: '0.75rem'
            }}
          >
            Flagged Payload: <code>{q}</code>
          </div>
        ))}
      </div>

      <div className="stage-box">
        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
          Stage 3: PayPal Read-vs-Write Cross-Examiner
        </div>
        <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginBottom: '6px' }}>
          Read Tools Queried: <code>{evaluation.crossExam.readToolsInvoked.join(', ')}</code>
        </div>
        {evaluation.crossExam.ledgerCitations.map(cite => (
          <div key={cite} style={{ fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px' }}>
            • {cite}
          </div>
        ))}
        {evaluation.crossExam.findings.map((f, idx) => (
          <div
            key={`${f.code}-${idx}`}
            style={{
              marginTop: '8px',
              padding: '8px',
              borderRadius: '6px',
              background:
                f.severity === 'CRITICAL'
                  ? 'rgba(239, 68, 68, 0.14)'
                  : 'rgba(245, 158, 11, 0.14)',
              fontSize: '0.76rem'
            }}
          >
            <strong>
              [{f.severity}] {f.title}
            </strong>
            <div>Agent Claim: {f.agentClaim}</div>
            <div>PayPal Ledger Fact: {f.ledgerFact}</div>
          </div>
        ))}
      </div>

      {evaluation.verdict === 'AUTO_EXECUTE' &&
        evaluation.executionStatus === 'NOT_EXECUTED' && (
          <button type="button" className="btn btn-green" onClick={onExecuteAuto}>
            Execute Verified Call on PayPal Ledger
          </button>
        )}

      {evaluation.verdict === 'PAUSE_FOR_APPROVAL' &&
        evaluation.executionStatus === 'PAUSED' && (
          <button type="button" className="btn btn-amber" onClick={onOpenApprovalModal}>
            Inspect Evidence Diff & Resolve Constitutional Hold
          </button>
        )}
    </section>
  );
};
