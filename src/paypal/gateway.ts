import type {
  PayPalDisputeRecord,
  PayPalInvoiceRecord,
  PayPalOrderRecord,
  PayPalSubscriptionRecord,
  PayPalTrackingRecord,
  PayPalTransactionRecord
} from '../types/paypal';

export interface PayPalGateway {
  readonly gatewayMode: 'SANDBOX_LEDGER' | 'LIVE_PAYPAL_SANDBOX';
  getRolling24hSpendUsd(): number;
  getOrder(orderId: string): PayPalOrderRecord | undefined;
  getInvoice(invoiceId: string): PayPalInvoiceRecord | undefined;
  listTransactions(recipientEmail?: string): PayPalTransactionRecord[];
  getShipmentTracking(orderId: string): PayPalTrackingRecord | undefined;
  getDispute(disputeId: string): PayPalDisputeRecord | undefined;
  getSubscription(subscriptionId: string): PayPalSubscriptionRecord | undefined;
  hasPriorRefund(orderId: string): boolean;
  recordPayment(params: {
    recipientName: string;
    recipientEmail: string;
    amountUsd: number;
    orderId?: string;
  }): PayPalTransactionRecord;
  recordRefund(orderId: string, amountUsd: number): PayPalTransactionRecord;
  resetLedger(): void;
}
