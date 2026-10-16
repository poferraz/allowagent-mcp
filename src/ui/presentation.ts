import type { PayPalMcpWriteTool } from '../types/mcp';
import type { ScenarioDefinition } from '../simulator/scenarios';
import type { ContradictionCode } from '../types/firewall';

export const money = (amount?: number | null) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD'
}).format(typeof amount === 'number' && Number.isFinite(amount) ? amount : 0);

export const TOOL_LABELS: Record<PayPalMcpWriteTool, string> = {
  pay_order: 'Pay orders', record_payment_for_invoice: 'Record invoice payments',
  create_refund: 'Issue refunds', accept_dispute_claim: 'Accept dispute claims',
  update_subscription: 'Update subscriptions', create_order: 'Create orders',
  cancel_subscription: 'Cancel subscriptions'
};

export const EXAMPLES: Record<ScenarioDefinition['id'], { title: string; description: string }> = {
  P1: { title: 'Monthly internet bill', description: 'Metro Fiber · Matches previous payments' },
  P2: { title: 'An unexpected extra charge', description: 'Sarah’s Eco Cleaning · $35.00 more than usual' },
  P3: { title: 'A suspicious invoice', description: 'CloudHost lookalike · Unfamiliar billing address' },
  B1: { title: 'A shipping delay refund', description: 'Order ORD-901 · $24.00 courtesy credit' },
  B2: { title: 'A disputed delivery', description: 'Order ORD-882 · Delivery confirmed by carrier' },
  B3: { title: 'A contractor payment', description: 'Nordic Design Studio · Above the automatic payment limit' }
};

export const FINDING_LABELS: Record<ContradictionCode, string> = {
  INVALID_TOOL_ARGUMENTS: 'Payment details are incomplete or invalid',
  MISSING_OR_INVALID_RESOURCE: 'The account record could not be verified',
  TOOL_NOT_IN_CONSTITUTION: 'This action is not allowed by your settings',
  SPOOFED_VENDOR_DOMAIN: 'The billing address does not match your trusted recipient',
  NEW_UNVERIFIED_VENDOR: 'This recipient is not on your trusted list',
  PRICE_CREEP_DETECTED: 'The amount is higher than your price increase limit',
  MAX_AUTOPAY_EXCEEDED: 'The amount exceeds your automatic payment limit',
  DAILY_CAP_EXCEEDED: 'This would exceed your spending limit for 24 hours',
  DOUBLE_REFUND_DETECTED: 'This order has already been refunded',
  DELIVERED_REFUND_CONFLICT: 'Delivery records do not support this refund',
  DELIVERED_DISPUTE_SURRENDER: 'The carrier confirms this order was delivered',
  SUBSCRIPTION_PRICE_SPIKE: 'The subscription price increased beyond your limit'
};
