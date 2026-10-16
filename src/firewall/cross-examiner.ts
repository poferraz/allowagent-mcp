import type { PayPalGateway } from '../paypal/gateway';
import type { SpendPolicy } from '../types/constitution';
import type { CrossExamResult } from '../types/firewall';
import type { McpToolCall } from '../types/mcp';
import { runOpsChecks } from './ops-checks';
import { runPaymentChecks, type PaymentCheckAccumulator } from './payment-checks';

export function crossExamineToolCall(
  call: McpToolCall,
  policy: SpendPolicy,
  gateway: PayPalGateway
): CrossExamResult {
  const acc: PaymentCheckAccumulator = {
    readToolsInvoked: [],
    findings: [],
    verifiedFactsComplete: true,
    addedLineItems: [],
    ledgerCitations: []
  };

  const isNoAmountTool = call.toolName === 'cancel_subscription';
  const amountValid = isNoAmountTool
    ? (call.args.amountUsd === undefined || (typeof call.args.amountUsd === 'number' && Number.isFinite(call.args.amountUsd) && call.args.amountUsd >= 0))
    : (typeof call.args.amountUsd === 'number' && Number.isFinite(call.args.amountUsd) && call.args.amountUsd > 0);

  if (!amountValid) {
    acc.verifiedFactsComplete = false;
    acc.findings.push({
      code: 'INVALID_TOOL_ARGUMENTS',
      severity: 'CRITICAL',
      title: 'Invalid or Non-Positive Monetary Amount',
      agentClaim: `Invoke ${call.toolName} with amount=${String(call.args.amountUsd)}`,
      ledgerFact: 'Monetary tool calls require a finite positive USD amount',
      readToolUsed: 'list_transactions'
    });
  }

  if (!policy.allowedTools.includes(call.toolName)) {
    acc.findings.push({
      code: 'TOOL_NOT_IN_CONSTITUTION',
      severity: 'CRITICAL',
      title: 'MCP Tool Capability Not Authorized in PAYPAL.md',
      agentClaim: `Invoke ${call.toolName}`,
      ledgerFact: `PAYPAL.md Allowed Tools list excludes ${call.toolName}`,
      readToolUsed: 'list_transactions'
    });
  }

  if (!amountValid) {
    return acc;
  }

  if (
    call.toolName === 'pay_order' ||
    call.toolName === 'record_payment_for_invoice' ||
    call.toolName === 'create_order'
  ) {
    runPaymentChecks(call, policy, gateway, acc);
  } else {
    runOpsChecks(call, policy, gateway, acc);
  }

  return acc;
}
