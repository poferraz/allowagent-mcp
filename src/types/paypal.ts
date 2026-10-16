export interface PayPalInvoiceLineItem {
  name: string;
  amountUsd: number;
  approvedBaseline?: boolean;
}

export interface PayPalInvoiceRecord {
  invoiceId: string;
  vendorName: string;
  vendorEmail: string;
  totalAmountUsd: number;
  historicalAverageUsd: number;
  lineItems: PayPalInvoiceLineItem[];
  note?: string;
}

export interface PayPalOrderRecord {
  orderId: string;
  recipientName: string;
  recipientEmail: string;
  totalAmountUsd: number;
  refundableBalanceUsd: number;
  status: 'CREATED' | 'COMPLETED' | 'REFUNDED';
}

export interface PayPalTransactionRecord {
  transactionId: string;
  recipientName: string;
  recipientEmail: string;
  amountUsd: number;
  timestampIso: string;
  type: 'PAYMENT' | 'REFUND';
  orderId?: string;
}

export interface PayPalTrackingRecord {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: 'LABEL_CREATED' | 'IN_TRANSIT' | 'DELIVERED';
  deliveredAtIso?: string;
}

export interface PayPalDisputeRecord {
  disputeId: string;
  orderId: string;
  reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED' | 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED';
  stage: 'INQUIRY' | 'CHARGEBACK';
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  amountUsd: number;
  buyerMessage: string;
}

export interface PayPalSubscriptionRecord {
  subscriptionId: string;
  planName: string;
  vendorEmail: string;
  currentMonthlyUsd: number;
  proposedMonthlyUsd: number;
}

export interface PayPalSandboxState {
  rolling24hSpendUsd: number;
  orders: Record<string, PayPalOrderRecord>;
  invoices: Record<string, PayPalInvoiceRecord>;
  transactions: PayPalTransactionRecord[];
  trackings: Record<string, PayPalTrackingRecord>;
  disputes: Record<string, PayPalDisputeRecord>;
  subscriptions: Record<string, PayPalSubscriptionRecord>;
  refundedOrderIds: string[];
}
