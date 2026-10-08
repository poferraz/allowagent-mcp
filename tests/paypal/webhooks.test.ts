import { describe, it, expect } from 'vitest';
import { parseWebhookEvent, verifyWebhookHeaders, WebhookEvent } from '../../src/paypal/webhooks';

describe('Webhook Parser', () => {
  it('parses CUSTOMER.DISPUTE.UPDATED event payload', () => {
    const rawPayload = {
      id: 'WH-001',
      event_type: 'CUSTOMER.DISPUTE.UPDATED',
      resource: {
        dispute_id: 'PP-D-1001',
        status: 'UNDER_REVIEW'
      }
    };

    const parsed: WebhookEvent = parseWebhookEvent(rawPayload);
    expect(parsed.id).toBe('WH-001');
    expect(parsed.eventType).toBe('CUSTOMER.DISPUTE.UPDATED');
    expect(parsed.disputeId).toBe('PP-D-1001');
    expect(parsed.resource.status).toBe('UNDER_REVIEW');
  });

  it('parses CUSTOMER.DISPUTE.CREATED and CUSTOMER.DISPUTE.RESOLVED events', () => {
    const createdPayload = {
      id: 'WH-002',
      event_type: 'CUSTOMER.DISPUTE.CREATED',
      resource: { dispute_id: 'PP-D-2001' }
    };
    expect(parseWebhookEvent(createdPayload).eventType).toBe('CUSTOMER.DISPUTE.CREATED');

    const resolvedPayload = {
      id: 'WH-003',
      event_type: 'CUSTOMER.DISPUTE.RESOLVED',
      resource: { dispute_id: 'PP-D-2001' }
    };
    expect(parseWebhookEvent(resolvedPayload).eventType).toBe('CUSTOMER.DISPUTE.RESOLVED');
  });

  it('categorizes unknown event types as OTHER', () => {
    const unknownPayload = {
      id: 'WH-004',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: { id: 'CAP-123' }
    };
    const parsed = parseWebhookEvent(unknownPayload);
    expect(parsed.eventType).toBe('OTHER');
    expect(parsed.disputeId).toBe('CAP-123');
  });

  it('throws error when payload is missing event_type', () => {
    expect(() => parseWebhookEvent(null)).toThrow(/missing event_type/);
    expect(() => parseWebhookEvent({})).toThrow(/missing event_type/);
  });

  it('falls back to generated ID and UNKNOWN disputeId when not provided', () => {
    const minimalPayload = {
      event_type: 'CUSTOMER.DISPUTE.UPDATED'
    };
    const parsed = parseWebhookEvent(minimalPayload);
    expect(parsed.id).toMatch(/^wh-/);
    expect(parsed.disputeId).toBe('UNKNOWN');
  });

  it('validates presence of PayPal webhook transmission headers', () => {
    const validHeaders = {
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-123',
      'paypal-transmission-id': 'trans-001',
      'paypal-transmission-sig': 'signature-base64',
      'paypal-transmission-time': '2026-10-08T00:00:00Z'
    };
    expect(verifyWebhookHeaders(validHeaders)).toBe(true);

    const missingHeader = {
      'paypal-auth-algo': 'SHA256withRSA'
    };
    expect(verifyWebhookHeaders(missingHeader)).toBe(false);
  });
});
