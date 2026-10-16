import initialSeed from '../../fixtures/ledger/sandbox-state.json';
import type {
  PayPalDisputeRecord,
  PayPalInvoiceRecord,
  PayPalOrderRecord,
  PayPalSandboxState,
  PayPalSubscriptionRecord,
  PayPalTrackingRecord,
  PayPalTransactionRecord
} from '../types/paypal';
import type { PayPalGateway } from './gateway';

function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class StatefulLedgerClient implements PayPalGateway {
  public readonly gatewayMode = 'SANDBOX_LEDGER' as const;
  private readonly baseSeed: PayPalSandboxState;
  private state: PayPalSandboxState;
  private seq = 1000;

  constructor(seed?: PayPalSandboxState) {
    this.baseSeed = deepCopy((seed ?? initialSeed) as PayPalSandboxState);
    this.state = deepCopy(this.baseSeed);
  }

  getRolling24hSpendUsd(): number {
    return Number(this.state.rolling24hSpendUsd.toFixed(2));
  }

  getOrder(orderId: string): PayPalOrderRecord | undefined {
    const rec = this.state.orders[orderId];
    return rec ? deepCopy(rec) : undefined;
  }

  getInvoice(invoiceId: string): PayPalInvoiceRecord | undefined {
    const rec = this.state.invoices[invoiceId];
    return rec ? deepCopy(rec) : undefined;
  }

  listTransactions(recipientEmail?: string): PayPalTransactionRecord[] {
    if (!recipientEmail) return deepCopy(this.state.transactions);
    const target = recipientEmail.trim().toLowerCase();
    return deepCopy(
      this.state.transactions.filter(t => t.recipientEmail.toLowerCase() === target)
    );
  }

  getShipmentTracking(orderId: string): PayPalTrackingRecord | undefined {
    const rec = this.state.trackings[orderId];
    return rec ? deepCopy(rec) : undefined;
  }

  getDispute(disputeId: string): PayPalDisputeRecord | undefined {
    const rec = this.state.disputes[disputeId];
    return rec ? deepCopy(rec) : undefined;
  }

  getSubscription(subscriptionId: string): PayPalSubscriptionRecord | undefined {
    const rec = this.state.subscriptions[subscriptionId];
    return rec ? deepCopy(rec) : undefined;
  }

  hasPriorRefund(orderId: string): boolean {
    return this.state.refundedOrderIds.includes(orderId);
  }

  recordPayment(params: {
    recipientName: string;
    recipientEmail: string;
    amountUsd: number;
    orderId?: string;
  }): PayPalTransactionRecord {
    if (!Number.isFinite(params.amountUsd) || params.amountUsd <= 0) {
      throw new Error(`Invalid monetary amount: ${params.amountUsd}`);
    }
    this.seq += 1;
    this.state.rolling24hSpendUsd = Number(
      (this.state.rolling24hSpendUsd + params.amountUsd).toFixed(2)
    );
    const record: PayPalTransactionRecord = {
      transactionId: `TXN-${this.seq}`,
      recipientName: params.recipientName,
      recipientEmail: params.recipientEmail,
      amountUsd: params.amountUsd,
      timestampIso: new Date().toISOString(),
      type: 'PAYMENT',
      orderId: params.orderId
    };
    this.state.transactions.unshift(record);
    return deepCopy(record);
  }

  recordRefund(orderId: string, amountUsd: number): PayPalTransactionRecord {
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      throw new Error(`Invalid monetary amount: ${amountUsd}`);
    }
    this.seq += 1;
    if (!this.state.refundedOrderIds.includes(orderId)) {
      this.state.refundedOrderIds.push(orderId);
    }
    const order = this.state.orders[orderId];
    if (order) {
      order.refundableBalanceUsd = Math.max(
        0,
        Number((order.refundableBalanceUsd - amountUsd).toFixed(2))
      );
      order.status = 'REFUNDED';
    }
    const record: PayPalTransactionRecord = {
      transactionId: `REF-${this.seq}`,
      recipientName: `Order ${orderId} Buyer`,
      recipientEmail: order?.recipientEmail ?? 'buyer@sandbox.paypal.com',
      amountUsd,
      timestampIso: new Date().toISOString(),
      type: 'REFUND',
      orderId
    };
    this.state.transactions.unshift(record);
    return deepCopy(record);
  }

  resetLedger(): void {
    this.state = deepCopy(this.baseSeed);
  }
}
