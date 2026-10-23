import type { PayPalGateway } from '../paypal/gateway';
import type {
  CrossExamResult,
  EvidenceDiffCard,
  FirewallEvaluation
} from '../types/firewall';
import type { McpToolCall } from '../types/mcp';
import { toCents } from '../types/money';

import { sha256Hex } from './sha256';

export type ApprovalAction = 'APPROVE_FULL' | 'AMEND_TO_BASELINE' | 'REJECT';

const consumedApprovalKeys = new Set<string>();

export function resetConsumedKeysForTesting(): void {
  consumedApprovalKeys.clear();
}

export function computePayloadHash(
  call: McpToolCall,
  verifiedBaselineUsd?: number
): string {
  const canonical = JSON.stringify({
    id: call.id,
    toolName: call.toolName,
    orderId: call.args.orderId ?? '',
    invoiceId: call.args.invoiceId ?? '',
    disputeId: call.args.disputeId ?? '',
    subscriptionId: call.args.subscriptionId ?? '',
    recipientName: call.args.recipientName ?? '',
    recipientEmail: (call.args.recipientEmail ?? '').trim().toLowerCase(),
    amountCents: toCents(call.args.amountUsd ?? 0),
    baselineCents:
      typeof verifiedBaselineUsd === 'number' ? toCents(verifiedBaselineUsd) : null,
    currency: call.args.currency ?? 'USD',
    reason: call.args.reason ?? '',
    untrustedContext: call.untrustedContext ?? ''
  });

  return `sha256-${sha256Hex(canonical)}`;
}

export function buildEvidenceDiffCard(
  call: McpToolCall,
  crossExam: CrossExamResult,
  payloadHash: string
): EvidenceDiffCard {
  const proposedAmountUsd = call.args.amountUsd ?? 0;
  const canAmendToBaseline =
    (call.toolName === 'record_payment_for_invoice' || call.toolName === 'pay_order') &&
    typeof crossExam.verifiedBaselineUsd === 'number' &&
    crossExam.verifiedBaselineUsd > 0 &&
    crossExam.verifiedBaselineUsd < proposedAmountUsd;

  const warningTitles = crossExam.findings.map(f => f.title).join(' | ');

  return {
    callId: call.id,
    toolName: call.toolName,
    proposedAmountUsd,
    verifiedBaselineUsd: crossExam.verifiedBaselineUsd,
    canAmendToBaseline,
    addedLineItems: crossExam.addedLineItems,
    ledgerCitations: crossExam.ledgerCitations,
    summary:
      warningTitles ||
      `Constitutional review required before executing ${call.toolName} ($${proposedAmountUsd.toFixed(2)}).`,
    payloadHash
  };
}

function dispatchValidatedWrite(
  call: McpToolCall,
  finalAmountUsd: number,
  gateway: PayPalGateway
): void {
  if (call.toolName === 'create_refund') {
    if (!call.args.orderId) throw new Error('create_refund requires orderId');
    gateway.recordRefund(call.args.orderId, finalAmountUsd);
    return;
  }
  if (
    call.toolName === 'pay_order' ||
    call.toolName === 'record_payment_for_invoice' ||
    call.toolName === 'create_order'
  ) {
    gateway.recordPayment({
      recipientName:
        call.args.recipientName ?? call.args.recipientEmail ?? 'PayPal Recipient',
      recipientEmail: call.args.recipientEmail ?? 'recipient@paypal.com',
      amountUsd: finalAmountUsd,
      orderId: call.args.orderId ?? call.args.invoiceId
    });
  }
}

export function executeAutonomousCall(
  evaluation: FirewallEvaluation,
  gateway: PayPalGateway
): FirewallEvaluation {
  if (evaluation.verdict !== 'AUTO_EXECUTE') {
    throw new Error(`Cannot auto-execute verdict: ${evaluation.verdict}`);
  }
  if (evaluation.executionStatus !== 'NOT_EXECUTED') {
    throw new Error(`Replay Defense: Evaluation already processed: ${evaluation.executionStatus}`);
  }
  const recomputed = computePayloadHash(
    evaluation.call,
    evaluation.crossExam.verifiedBaselineUsd
  );
  if (recomputed !== evaluation.payloadHash) {
    throw new Error('Payload hash mismatch: call parameters were tampered after evaluation');
  }
  const consumptionKey = `${evaluation.call.id}:${evaluation.payloadHash}`;
  if (consumedApprovalKeys.has(consumptionKey)) {
    throw new Error(`Execution already consumed for ${consumptionKey}`);
  }
  consumedApprovalKeys.add(consumptionKey);

  dispatchValidatedWrite(evaluation.call, evaluation.call.args.amountUsd ?? 0, gateway);
  return {
    ...evaluation,
    executionStatus: 'EXECUTED_FULL',
    executedAmountUsd: evaluation.call.args.amountUsd
  };
}

export function resolveApprovalDecision(
  evaluation: FirewallEvaluation,
  decision: ApprovalAction,
  gateway: PayPalGateway,
  expectedHash: string
): FirewallEvaluation {
  if (evaluation.verdict !== 'PAUSE_FOR_APPROVAL') {
    throw new Error(`Cannot resolve approval on verdict: ${evaluation.verdict}`);
  }
  if (evaluation.executionStatus !== 'PAUSED') {
    throw new Error(`Approval not in PAUSED state: ${evaluation.executionStatus}`);
  }

  const recomputed = computePayloadHash(
    evaluation.call,
    evaluation.crossExam.verifiedBaselineUsd
  );
  if (evaluation.payloadHash !== expectedHash || recomputed !== expectedHash) {
    throw new Error(
      `Payload hash mismatch: expected ${expectedHash}, recomputed ${recomputed}`
    );
  }

  const consumptionKey = `${evaluation.call.id}:${expectedHash}`;
  if (consumedApprovalKeys.has(consumptionKey)) {
    throw new Error(`Approval already consumed for ${consumptionKey}`);
  }
  consumedApprovalKeys.add(consumptionKey);

  if (decision === 'REJECT') {
    return {
      ...evaluation,
      executionStatus: 'REJECTED_BY_HUMAN',
      executedAmountUsd: undefined
    };
  }

  let finalAmountUsd = evaluation.call.args.amountUsd ?? 0;
  if (decision === 'AMEND_TO_BASELINE') {
    const invoiceId = evaluation.call.args.invoiceId;
    const ledgerInvoice = invoiceId ? gateway.getInvoice(invoiceId) : undefined;
    if (
      !ledgerInvoice ||
      !evaluation.diffCard?.canAmendToBaseline ||
      toCents(ledgerInvoice.historicalAverageUsd) !==
        toCents(evaluation.diffCard.verifiedBaselineUsd ?? -1)
    ) {
      throw new Error('Baseline amendment failed ledger re-verification');
    }
    finalAmountUsd = ledgerInvoice.historicalAverageUsd;
  }

  dispatchValidatedWrite(evaluation.call, finalAmountUsd, gateway);

  return {
    ...evaluation,
    executionStatus:
      decision === 'AMEND_TO_BASELINE' ? 'EXECUTED_BASELINE_AMENDED' : 'EXECUTED_FULL',
    executedAmountUsd: finalAmountUsd
  };
}
