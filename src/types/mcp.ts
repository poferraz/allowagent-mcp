export type PayPalMcpWriteTool =
  | 'pay_order'
  | 'record_payment_for_invoice'
  | 'create_order'
  | 'create_refund'
  | 'accept_dispute_claim'
  | 'update_subscription'
  | 'cancel_subscription';

export type PayPalMcpReadTool =
  | 'get_invoice'
  | 'list_invoices'
  | 'list_transactions'
  | 'get_order'
  | 'get_refund'
  | 'get_shipment_tracking'
  | 'get_dispute'
  | 'show_subscription_details';

export interface McpToolArgs {
  orderId?: string;
  invoiceId?: string;
  disputeId?: string;
  subscriptionId?: string;
  recipientName?: string;
  recipientEmail?: string;
  amountUsd: number;
  currency?: 'USD';
  reason?: string;
}

export interface McpToolCall {
  id: string;
  toolName: PayPalMcpWriteTool;
  agentSummary: string;
  args: McpToolArgs;
  untrustedContext?: string;
  untrustedSourceLabel?: string;
}
