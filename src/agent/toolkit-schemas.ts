// Formal @paypal/agent-toolkit tool specifications for LLM function calling (<200 lines)

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export const PAYPAL_AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'pay_order',
    description: 'Capture or settle an authorized PayPal order for a merchant or service provider.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Authoritative PayPal Order ID (e.g. ORD-101)' },
        invoiceId: { type: 'string', description: 'Associated PayPal Invoice ID if applicable' },
        recipientName: { type: 'string', description: 'Name of the recipient or merchant' },
        recipientEmail: { type: 'string', description: 'PayPal account email of the recipient' },
        amountUsd: { type: 'number', description: 'Gross amount in USD to pay' },
        currency: { type: 'string', description: 'ISO-4217 3-letter currency code, default USD' }
      },
      required: ['orderId', 'amountUsd']
    }
  },
  {
    name: 'record_payment_for_invoice',
    description: 'Record an external or direct payment against a PayPal invoice.',
    parameters: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'PayPal Invoice ID (e.g. INV2-SARAH-104)' },
        recipientName: { type: 'string', description: 'Invoicer / merchant legal or trade name' },
        recipientEmail: { type: 'string', description: 'Invoicer email address' },
        amountUsd: { type: 'number', description: 'Payment amount in USD' },
        currency: { type: 'string', description: 'Currency code, default USD' }
      },
      required: ['invoiceId', 'amountUsd']
    }
  },
  {
    name: 'create_refund',
    description: 'Issue a full or partial refund for a captured PayPal order or transaction.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Original PayPal Order ID to refund (e.g. ORD-772)' },
        amountUsd: { type: 'number', description: 'Refund amount in USD' },
        reason: { type: 'string', description: 'Customer or operational reason for refund' }
      },
      required: ['orderId', 'amountUsd']
    }
  },
  {
    name: 'accept_dispute_claim',
    description: 'Accept customer dispute claim and surrender transaction amount to buyer.',
    parameters: {
      type: 'object',
      properties: {
        disputeId: { type: 'string', description: 'PayPal Dispute ID (e.g. DSP-3301)' },
        amountUsd: { type: 'number', description: 'Dispute settlement amount in USD' },
        reason: { type: 'string', description: 'Acceptance note or resolution reason' }
      },
      required: ['disputeId', 'amountUsd']
    }
  },
  {
    name: 'update_subscription',
    description: 'Modify active PayPal subscription pricing or parameters.',
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string', description: 'PayPal Subscription ID (e.g. SUB-901)' },
        amountUsd: { type: 'number', description: 'New monthly recurring price in USD' }
      },
      required: ['subscriptionId', 'amountUsd']
    }
  },
  {
    name: 'cancel_subscription',
    description: 'Cancel an active recurring PayPal subscription.',
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string', description: 'PayPal Subscription ID' },
        reason: { type: 'string', description: 'Cancellation justification' }
      },
      required: ['subscriptionId']
    }
  }
];
