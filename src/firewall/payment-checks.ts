import type { PayPalGateway } from '../paypal/gateway';
import type { SpendPolicy } from '../types/constitution';
import type { LedgerFinding } from '../types/firewall';
import type { McpToolCall, PayPalMcpReadTool } from '../types/mcp';
import { toCents } from '../types/money';

export interface PaymentCheckAccumulator {
  readToolsInvoked: PayPalMcpReadTool[];
  findings: LedgerFinding[];
  verifiedFactsComplete: boolean;
  ledgerUntrustedText?: string;
  verifiedBaselineUsd?: number;
  priceCreepPercent?: number;
  addedLineItems: string[];
  ledgerCitations: string[];
}

function isLookalikeSpoof(email: string, trustedEmails: string[]): string | null {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  for (const trusted of trustedEmails) {
    const trustedDomain = trusted.split('@')[1]?.toLowerCase() ?? '';
    const trustedRoot = trustedDomain.split('.')[0] ?? '';
    if (trustedRoot.length >= 4 && domain !== trustedDomain && domain.includes(trustedRoot)) {
      return trusted;
    }
  }
  return null;
}

export function runPaymentChecks(
  call: McpToolCall,
  policy: SpendPolicy,
  gateway: PayPalGateway,
  acc: PaymentCheckAccumulator
): void {
  const markRead = (t: PayPalMcpReadTool) => {
    if (!acc.readToolsInvoked.includes(t)) acc.readToolsInvoked.push(t);
  };

  const { amountUsd = 0, recipientEmail, invoiceId, orderId } = call.args;
  const trustedEmails = policy.trustedVendors.map(v => v.email.toLowerCase());
  const normalizedCallerEmail = recipientEmail?.trim().toLowerCase();

  markRead('list_transactions');
  const rolling24h = gateway.getRolling24hSpendUsd();
  acc.ledgerCitations.push(
    `PayPal Rolling 24h Spend: $${rolling24h.toFixed(2)} / $${policy.dailySpendCapUsd.toFixed(2)} USD`
  );

  let authoritativeEmail: string | undefined;

  if (invoiceId) {
    markRead('get_invoice');
    const invoice = gateway.getInvoice(invoiceId);
    if (!invoice) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Referenced PayPal Invoice Does Not Exist',
        agentClaim: `Pay Invoice ${invoiceId}`,
        ledgerFact: `PayPal get_invoice found no record for ${invoiceId}`,
        readToolUsed: 'get_invoice'
      });
      return;
    }

    authoritativeEmail = invoice.vendorEmail.toLowerCase();
    if (invoice.note) acc.ledgerUntrustedText = invoice.note;

    if (
      (normalizedCallerEmail && normalizedCallerEmail !== authoritativeEmail) ||
      toCents(amountUsd) !== toCents(invoice.totalAmountUsd)
    ) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Invoice Vendor or Total Mismatch Against Ledger',
        agentClaim: `Pay ${normalizedCallerEmail ?? 'unknown'} $${amountUsd.toFixed(2)} on ${invoiceId}`,
        ledgerFact: `Invoice ${invoiceId} belongs to ${invoice.vendorEmail} for $${invoice.totalAmountUsd.toFixed(2)}`,
        readToolUsed: 'get_invoice'
      });
    }

    const history = gateway.listTransactions(authoritativeEmail);
    acc.verifiedBaselineUsd = invoice.historicalAverageUsd;
    acc.ledgerCitations.push(
      `Invoice ${invoice.invoiceId}: Total $${invoice.totalAmountUsd.toFixed(2)} vs. 3-mo avg $${invoice.historicalAverageUsd.toFixed(2)} (${history.length} prior payments)`
    );
    for (const item of invoice.lineItems) {
      if (item.approvedBaseline === false) {
        acc.addedLineItems.push(`+$${item.amountUsd.toFixed(2)} — ${item.name}`);
      }
    }

    if (policy.requireHistoricalInvoiceCheck && invoice.historicalAverageUsd > 0) {
      const amountCents = toCents(amountUsd);
      const baselineCents = toCents(invoice.historicalAverageUsd);
      const toleranceBps = Math.round(policy.priceCreepTolerancePercent * 100);
      acc.priceCreepPercent = Number(
        (((amountUsd - invoice.historicalAverageUsd) / invoice.historicalAverageUsd) * 100).toFixed(1)
      );
      if ((amountCents - baselineCents) * 10000 > baselineCents * toleranceBps) {
        acc.findings.push({
          code: 'PRICE_CREEP_DETECTED',
          severity: 'WARNING',
          title: `Invoice Price Creep (+${acc.priceCreepPercent}% vs. ${policy.priceCreepTolerancePercent}% limit)`,
          agentClaim: `Pay $${amountUsd.toFixed(2)} for ${invoice.invoiceId}`,
          ledgerFact: `3-month PayPal average is $${invoice.historicalAverageUsd.toFixed(2)}. Unapproved line item(s): ${acc.addedLineItems.join(', ') || 'rate increase'}`,
          readToolUsed: 'get_invoice'
        });
      }
    }
  } else if (orderId) {
    markRead('get_order');
    const order = gateway.getOrder(orderId);
    if (!order || toCents(order.totalAmountUsd) !== toCents(amountUsd)) {
      acc.verifiedFactsComplete = false;
      acc.findings.push({
        code: 'MISSING_OR_INVALID_RESOURCE',
        severity: 'CRITICAL',
        title: 'Referenced PayPal Order Missing or Amount Mismatch',
        agentClaim: `Pay Order ${orderId} ($${amountUsd.toFixed(2)})`,
        ledgerFact: order
          ? `Order ${orderId} total is $${order.totalAmountUsd.toFixed(2)}`
          : `Order ${orderId} not found in PayPal ledger`,
        readToolUsed: 'get_order'
      });
      return;
    }
    authoritativeEmail = order.recipientEmail.toLowerCase();
  } else if (call.toolName === 'create_order' && normalizedCallerEmail) {
    authoritativeEmail = normalizedCallerEmail;
  } else {
    acc.verifiedFactsComplete = false;
    acc.findings.push({
      code: 'MISSING_OR_INVALID_RESOURCE',
      severity: 'CRITICAL',
      title: 'Missing Required Invoice or Order Identifier',
      agentClaim: `Execute ${call.toolName} for $${amountUsd.toFixed(2)}`,
      ledgerFact: 'Payment tools require a verifiable invoiceId or orderId',
      readToolUsed: 'list_transactions'
    });
    return;
  }

  const targetEmail = authoritativeEmail ?? normalizedCallerEmail ?? '';
  const spoofTarget = isLookalikeSpoof(targetEmail, trustedEmails);
  if (spoofTarget) {
    acc.findings.push({
      code: 'SPOOFED_VENDOR_DOMAIN',
      severity: 'CRITICAL',
      title: 'Lookalike Vendor Domain Spoofing Detected',
      agentClaim: `Pay recipient ${targetEmail}`,
      ledgerFact: `Trusted PayPal vendor on file is ${spoofTarget} (domain mismatch)`,
      readToolUsed: 'list_transactions'
    });
  } else if (!trustedEmails.includes(targetEmail)) {
    const isStrict = policy.unknownVendorPolicy === 'HARD_BLOCK';
    acc.findings.push({
      code: 'NEW_UNVERIFIED_VENDOR',
      severity: isStrict ? 'CRITICAL' : 'WARNING',
      title: isStrict
        ? 'Blocked by Strict Constitutional Vault (Vendor Not in PAYPAL.md)'
        : 'Recipient Not in Trusted PayPal Vendors',
      agentClaim: `Send $${amountUsd.toFixed(2)} to ${targetEmail}`,
      ledgerFact: `0 prior verified transactions with ${targetEmail} (Policy: ${policy.unknownVendorPolicy})`,
      readToolUsed: 'list_transactions'
    });
  }

  if (toCents(amountUsd) > toCents(policy.maxAutoPayUsd)) {
    acc.findings.push({
      code: 'MAX_AUTOPAY_EXCEEDED',
      severity: 'WARNING',
      title: 'Exceeds Constitutional Max Auto-Pay Threshold',
      agentClaim: `Auto-pay $${amountUsd.toFixed(2)} USD`,
      ledgerFact: `PAYPAL.md Max Auto-Pay is capped at $${policy.maxAutoPayUsd.toFixed(2)} USD`,
      readToolUsed: 'list_transactions'
    });
  }

  if (toCents(rolling24h) + toCents(amountUsd) > toCents(policy.dailySpendCapUsd)) {
    acc.findings.push({
      code: 'DAILY_CAP_EXCEEDED',
      severity: 'WARNING',
      title: '24-Hour Spend Velocity Limit Exceeded',
      agentClaim: `Spend $${amountUsd.toFixed(2)} USD now`,
      ledgerFact: `Projected 24h spend ($${(rolling24h + amountUsd).toFixed(2)}) exceeds $${policy.dailySpendCapUsd.toFixed(2)} cap`,
      readToolUsed: 'list_transactions'
    });
  }
}
