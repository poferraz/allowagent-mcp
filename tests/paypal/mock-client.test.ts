import { describe, it, expect } from 'vitest';
import { MockPayPalClient } from '../../src/paypal/mock-client';
import { WebhookEvent } from '../../src/paypal/webhooks';

describe('Mock PayPal Client', () => {
  it('loads seeded case and executes inquiry message submission', async () => {
    const client = new MockPayPalClient();
    const dispute = await client.getDispute('PP-D-1001');
    expect(dispute.dispute_id).toBe('PP-D-1001');
    expect(dispute.dispute_life_cycle_stage).toBe('INQUIRY');

    const result = await client.sendMessage('PP-D-1001', 'Tracking shows label created only');
    expect(result.success).toBe(true);
    expect(client.getSubmittedMessages('PP-D-1001').length).toBe(1);
    expect(client.getSubmittedMessages('PP-D-1001')[0]).toBe('Tracking shows label created only');
  });

  it('rejects illegal provideSupportingInfo call during INQUIRY', async () => {
    const client = new MockPayPalClient();
    await expect(client.provideSupportingInfo('PP-D-1001', 'Some note'))
      .rejects.toThrow(/prohibited in INQUIRY stage/);
  });

  it('throws error when dispute is not found', async () => {
    const client = new MockPayPalClient();
    await expect(client.getDispute('PP-D-9999'))
      .rejects.toThrow(/not found in mock store/);
  });

  it('allows provideEvidence when status is WAITING_FOR_BUYER_RESPONSE', async () => {
    const client = new MockPayPalClient();
    const evidencePayload = { notes: 'Proof of non-receipt', documents: [{ name: 'receipt.pdf' }] };
    const result = await client.provideEvidence('PP-D-1003', evidencePayload);
    expect(result.success).toBe(true);
    expect(client.getSubmittedEvidences('PP-D-1003').length).toBe(1);
    expect(client.getSubmittedEvidences('PP-D-1003')[0].notes).toBe('Proof of non-receipt');
  });

  it('rejects provideEvidence when status is not WAITING_FOR_BUYER_RESPONSE', async () => {
    const client = new MockPayPalClient();
    await expect(client.provideEvidence('PP-D-1001', { notes: 'Premature evidence' }))
      .rejects.toThrow(/WAITING_FOR_BUYER_RESPONSE/);
  });

  it('allows escalate during INQUIRY and transitions life cycle stage', async () => {
    const client = new MockPayPalClient();
    const result = await client.escalate('PP-D-1001');
    expect(result.success).toBe(true);

    const updated = await client.getDispute('PP-D-1001');
    expect(updated.dispute_life_cycle_stage).toBe('CHARGEBACK');
  });

  it('rejects escalate when not in INQUIRY stage', async () => {
    const client = new MockPayPalClient();
    await expect(client.escalate('PP-D-1003'))
      .rejects.toThrow(/can only be performed from INQUIRY stage/);
  });

  it('dispatches webhook events and updates internal dispute store', async () => {
    const client = new MockPayPalClient();
    const receivedEvents: WebhookEvent[] = [];

    const unsubscribe = client.onWebhook((ev) => {
      receivedEvents.push(ev);
    });

    const event: WebhookEvent = {
      id: 'WH-TEST-1',
      eventType: 'CUSTOMER.DISPUTE.UPDATED',
      disputeId: 'PP-D-1001',
      resource: {
        dispute_id: 'PP-D-1001',
        status: 'UNDER_REVIEW'
      }
    };

    client.dispatchWebhook(event);

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].id).toBe('WH-TEST-1');

    const updated = await client.getDispute('PP-D-1001');
    expect(updated.status).toBe('UNDER_REVIEW');

    unsubscribe();
    client.dispatchWebhook({
      id: 'WH-TEST-2',
      eventType: 'CUSTOMER.DISPUTE.UPDATED',
      disputeId: 'PP-D-1001',
      resource: { status: 'RESOLVED' }
    });
    expect(receivedEvents.length).toBe(1);
  });
});
