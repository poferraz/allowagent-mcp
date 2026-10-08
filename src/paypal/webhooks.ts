export type WebhookEventType =
  | 'CUSTOMER.DISPUTE.CREATED'
  | 'CUSTOMER.DISPUTE.UPDATED'
  | 'CUSTOMER.DISPUTE.RESOLVED'
  | 'OTHER';

export interface WebhookEvent {
  id: string;
  eventType: WebhookEventType;
  disputeId: string;
  resource: Record<string, any>;
  summary?: string;
  createTime?: string;
}

export function parseWebhookEvent(payload: any): WebhookEvent {
  if (!payload || !payload.event_type) {
    throw new Error('Invalid webhook payload: missing event_type');
  }

  const disputeId = payload.resource?.dispute_id || payload.resource?.id || 'UNKNOWN';

  const knownTypes: WebhookEventType[] = [
    'CUSTOMER.DISPUTE.CREATED',
    'CUSTOMER.DISPUTE.UPDATED',
    'CUSTOMER.DISPUTE.RESOLVED'
  ];

  const eventType: WebhookEventType = knownTypes.includes(payload.event_type)
    ? payload.event_type
    : 'OTHER';

  return {
    id: payload.id || `wh-${Date.now()}`,
    eventType,
    disputeId,
    resource: payload.resource || {},
    summary: payload.summary,
    createTime: payload.create_time
  };
}

export function verifyWebhookHeaders(headers: Record<string, string | undefined>): boolean {
  if (!headers || typeof headers !== 'object') {
    return false;
  }
  const required = [
    'paypal-auth-algo',
    'paypal-cert-url',
    'paypal-transmission-id',
    'paypal-transmission-sig',
    'paypal-transmission-time'
  ];

  const normalized: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }

  return required.every(key => Boolean(normalized[key]));
}
