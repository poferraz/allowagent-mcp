import type { PayPalGateway } from '../paypal/gateway';
import type { SpendPolicy } from '../types/constitution';
import type { FirewallEvaluation, FirewallVerdictType } from '../types/firewall';
import type { McpToolCall } from '../types/mcp';
import { buildEvidenceDiffCard, computePayloadHash } from './approval-gate';
import { crossExamineToolCall } from './cross-examiner';
import { scanForPromptInjection } from './injection-scanner';

export function evaluateToolCall(
  call: McpToolCall,
  policy: SpendPolicy,
  gateway: PayPalGateway,
  nowIso: string = new Date().toISOString()
): FirewallEvaluation {
  const clonedCall: McpToolCall = JSON.parse(JSON.stringify(call));
  const crossExam = crossExamineToolCall(clonedCall, policy, gateway);

  const combinedUntrusted = [
    clonedCall.untrustedContext,
    crossExam.ledgerUntrustedText
  ]
    .filter(Boolean)
    .join('\n');

  const injectionScan = scanForPromptInjection(combinedUntrusted || undefined);
  const payloadHash = computePayloadHash(clonedCall, crossExam.verifiedBaselineUsd);

  const criticalFinding = crossExam.findings.find(f => f.severity === 'CRITICAL');
  const warningFinding = crossExam.findings.find(f => f.severity === 'WARNING');

  let verdict: FirewallVerdictType = 'HARD_BLOCK';
  let triggeredRule = 'Blocked by Default-Deny Constitutional Guard';

  if (injectionScan.detected && policy.blockPromptInjection === 'STRICT') {
    verdict = 'HARD_BLOCK';
    triggeredRule = `Stage 2 Taint Block: ${injectionScan.vectors.join(', ')}`;
  } else if (criticalFinding) {
    verdict = 'HARD_BLOCK';
    triggeredRule = `Stage 3 Critical Contradiction: ${criticalFinding.title}`;
  } else if (!crossExam.verifiedFactsComplete) {
    verdict = 'HARD_BLOCK';
    triggeredRule = 'Stage 3 Positive Verification Failed: Incomplete Ledger Facts';
  } else if (policy.isFailClosed) {
    verdict = 'PAUSE_FOR_APPROVAL';
    triggeredRule = 'Stage 1 Fail-Closed Guard: PAYPAL.md has missing/malformed limits';
  } else if (injectionScan.detected) {
    verdict = 'PAUSE_FOR_APPROVAL';
    triggeredRule = `Stage 2 Taint Warning: ${injectionScan.vectors.join(', ')}`;
  } else if (warningFinding) {
    verdict = 'PAUSE_FOR_APPROVAL';
    triggeredRule = `Stage 3 Policy Gate: ${warningFinding.title}`;
  } else if (crossExam.verifiedFactsComplete && crossExam.findings.length === 0) {
    verdict = 'AUTO_EXECUTE';
    triggeredRule = 'Verified Safe Within Constitutional Spend & Ledger Bounds';
  }

  if (verdict === 'AUTO_EXECUTE') {
    return {
      call: clonedCall,
      injectionScan,
      crossExam,
      verdict,
      triggeredRule,
      payloadHash,
      executionStatus: 'NOT_EXECUTED',
      timestampIso: nowIso
    };
  }

  if (verdict === 'PAUSE_FOR_APPROVAL') {
    return {
      call: clonedCall,
      injectionScan,
      crossExam,
      verdict,
      triggeredRule,
      payloadHash,
      diffCard: buildEvidenceDiffCard(clonedCall, crossExam, payloadHash),
      executionStatus: 'PAUSED',
      timestampIso: nowIso
    };
  }

  return {
    call: clonedCall,
    injectionScan,
    crossExam,
    verdict,
    triggeredRule,
    payloadHash,
    executionStatus: 'BLOCKED',
    timestampIso: nowIso
  };
}
