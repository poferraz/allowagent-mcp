import type { PayPalGateway } from '../paypal/gateway';
import type { SpendPolicy } from '../types/constitution';
import type { McpToolCall, PayPalMcpReadTool } from '../types/mcp';
import { toCents } from '../types/money';
import type { PaymentCheckAccumulator } from './payment-checks';

export function runOpsChecks(
  call: McpToolCall,
  policy: SpendPolicy,
  gateway: PayPalGateway,
  acc: PaymentCheckAccumulator
): void {
  const markRead = (t: PayPalMcpReadTool) => {
    if (!acc.readToolsInvoked.includes(t)) acc.readToolsInvoked.push(t);
  };

  const { amountUsd, orderId, disputeId, subscriptionId } = call.args;

  if (call.toolName === 'create_refund') {
    markRead('get_order');
    if (!orderId) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Refund Missing Required Order ID',
        agentClaim: `Issue $${amountUsd.toFixed(2)} refund`,
        ledgerFact: 'create_refund requires a valid orderId',
        readToolUsed: 'get_order'
      });
      return;
    }
    const order = gateway.getOrder(orderId);
    if (!order) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Refund Target Order Does Not Exist',
        agentClaim: `Refund ${orderId} ($${amountUsd.toFixed(2)})`,
        ledgerFact: `PayPal get_order found no record for ${orderId}`,
        readToolUsed: 'get_order'
      });
      return;
    }

    markRead('get_refund');
    markRead('get_shipment_tracking');
    const tracking = gateway.getShipmentTracking(orderId);
    const alreadyRefunded = gateway.hasPriorRefund(orderId);
    acc.ledgerCitations.push(
      `Order ${orderId}: Prior refunds = ${alreadyRefunded ? 'YES' : '0'}, Remaining balance = $${order.refundableBalanceUsd.toFixed(2)}, Carrier = ${tracking?.status ?? 'UNKNOWN'}`
    );

    if (alreadyRefunded || toCents(amountUsd) > toCents(order.refundableBalanceUsd)) {
      acc.findings.push({
        code: 'DOUBLE_REFUND_DETECTED',
        severity: 'CRITICAL',
        title: 'Duplicate or Over-Balance Refund Attempt',
        agentClaim: `Issue $${amountUsd.toFixed(2)} refund for ${orderId}`,
        ledgerFact: `PayPal get_refund confirms ${orderId} remaining refundable balance is $${order.refundableBalanceUsd.toFixed(2)}`,
        readToolUsed: 'get_refund'
      });
    }

    if (policy.requireNonDeliveryForRefundOrDispute && tracking?.status === 'DELIVERED') {
      acc.findings.push({
        code: 'DELIVERED_REFUND_CONFLICT',
        severity: 'CRITICAL',
        title: 'Carrier Proves Delivery Against Non-Receipt Refund',
        agentClaim: `Refund ${orderId} ($${amountUsd.toFixed(2)})`,
        ledgerFact: `Carrier ${tracking.carrier} #${tracking.trackingNumber} scanned DELIVERED`,
        readToolUsed: 'get_shipment_tracking'
      });
    } else if (toCents(amountUsd) > toCents(policy.maxAutoRefundUsd)) {
      acc.findings.push({
        code: 'MAX_AUTOPAY_EXCEEDED',
        severity: 'WARNING',
        title: 'Exceeds Max Auto-Refund Threshold',
        agentClaim: `Auto-refund $${amountUsd.toFixed(2)} USD`,
        ledgerFact: `PAYPAL.md Max Auto-Refund is $${policy.maxAutoRefundUsd.toFixed(2)} USD`,
        readToolUsed: 'get_order'
      });
    }
    return;
  }

  if (call.toolName === 'accept_dispute_claim') {
    markRead('get_dispute');
    if (!disputeId) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Dispute Claim Missing Required Dispute ID',
        agentClaim: 'Call accept_dispute_claim',
        ledgerFact: 'accept_dispute_claim requires a valid disputeId',
        readToolUsed: 'get_dispute'
      });
      return;
    }
    const dispute = gateway.getDispute(disputeId);
    if (!dispute) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Referenced PayPal Dispute Not Found',
        agentClaim: `Accept dispute ${disputeId}`,
        ledgerFact: `PayPal get_dispute found no record for ${disputeId}`,
        readToolUsed: 'get_dispute'
      });
      return;
    }

    acc.ledgerUntrustedText = dispute.buyerMessage;
    if (orderId && orderId !== dispute.orderId) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Caller Order ID Contradicts Authoritative Dispute Record',
        agentClaim: `Dispute ${disputeId} on order ${orderId}`,
        ledgerFact: `Dispute ${disputeId} is bound to order ${dispute.orderId}`,
        readToolUsed: 'get_dispute'
      });
    }

    markRead('get_shipment_tracking');
    const tracking = gateway.getShipmentTracking(dispute.orderId);
    acc.ledgerCitations.push(
      `Dispute ${disputeId} (${dispute.stage}): Carrier ${tracking?.carrier ?? 'N/A'} #${tracking?.trackingNumber ?? 'N/A'} status = ${tracking?.status ?? 'UNKNOWN'}`
    );
    if (policy.requireNonDeliveryForRefundOrDispute && tracking?.status === 'DELIVERED') {
      acc.findings.push({
        code: 'DELIVERED_DISPUTE_SURRENDER',
        severity: 'CRITICAL',
        title: 'Blocked Surrender of Defensible Dispute (Carrier Delivered)',
        agentClaim: `Call accept_dispute_claim on ${disputeId} ($${amountUsd.toFixed(2)})`,
        ledgerFact: `${tracking.carrier} #${tracking.trackingNumber} scanned DELIVERED on ${tracking.deliveredAtIso ?? 'record'}`,
        readToolUsed: 'get_shipment_tracking'
      });
    }
    return;
  }

  if (call.toolName === 'update_subscription' || call.toolName === 'cancel_subscription') {
    markRead('show_subscription_details');
    const sub = subscriptionId ? gateway.getSubscription(subscriptionId) : undefined;
    if (!sub) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Subscription Record Missing or Invalid',
        agentClaim: `${call.toolName} (${subscriptionId ?? 'missing'})`,
        ledgerFact: 'PayPal show_subscription_details found no matching subscription',
        readToolUsed: 'show_subscription_details'
      });
      return;
    }
    acc.ledgerCitations.push(
      `Subscription ${sub.subscriptionId}: $${sub.currentMonthlyUsd.toFixed(2)}/mo (${sub.planName})`
    );
    if (call.toolName === 'update_subscription') {
      const baseCents = toCents(sub.currentMonthlyUsd);
      const nextCents = toCents(amountUsd);
      const toleranceBps = Math.round(policy.priceCreepTolerancePercent * 100);
      if ((nextCents - baseCents) * 10000 > baseCents * toleranceBps) {
        const deltaPct = ((amountUsd - sub.currentMonthlyUsd) / sub.currentMonthlyUsd) * 100;
        acc.findings.push({
          code: 'SUBSCRIPTION_PRICE_SPIKE',
          severity: 'WARNING',
          title: `Subscription Price Hike (+${deltaPct.toFixed(1)}%)`,
          agentClaim: `Update ${sub.planName} to $${amountUsd.toFixed(2)}/mo`,
          ledgerFact: `Current plan is $${sub.currentMonthlyUsd.toFixed(2)}/mo`,
          readToolUsed: 'show_subscription_details'
        });
      }
    }
  }
}
