import { describe, it, expect } from 'vitest';
import { DisputeCase } from '../src/types/paypal';
import inrInquiryOpen from '../fixtures/disputes/inr-inquiry-open.json';
import inrInquirySellerWait from '../fixtures/disputes/inr-inquiry-seller-wait.json';
import inrClaimBuyerWait from '../fixtures/disputes/inr-claim-buyer-wait.json';
import inrResolved from '../fixtures/disputes/inr-resolved.json';

import orderConfirmation from '../fixtures/evidence/order-confirmation.txt?raw';
import trackingLabelOnly from '../fixtures/evidence/tracking-label-only.txt?raw';
import trackingDelivered from '../fixtures/evidence/tracking-delivered.txt?raw';
import merchantChatPromise from '../fixtures/evidence/merchant-chat-promise.txt?raw';

describe('Test Fixtures Integrity', () => {
  it('loads valid INQUIRY stage fixture with send-message link', () => {
    const dispute: DisputeCase = inrInquiryOpen as DisputeCase;
    expect(dispute.dispute_life_cycle_stage).toBe('INQUIRY');
    expect(dispute.status).toBe('OPEN');
    expect(dispute.links?.some((l) => l.rel === 'send-message')).toBe(true);
    expect(dispute.links?.some((l) => l.rel === 'provide-supporting-info')).toBe(false);
  });

  it('loads valid INQUIRY stage seller-wait fixture', () => {
    const dispute: DisputeCase = inrInquirySellerWait as DisputeCase;
    expect(dispute.dispute_life_cycle_stage).toBe('INQUIRY');
    expect(dispute.status).toBe('WAITING_FOR_SELLER_RESPONSE');
    expect(dispute.seller_response_due_date).toBeDefined();
    expect(dispute.evidences?.length).toBe(2);
    expect(dispute.links?.some((l) => l.rel === 'send-message')).toBe(true);
    expect(dispute.links?.some((l) => l.rel === 'provide-supporting-info')).toBe(false);
  });

  it('loads valid CLAIM stage fixture with provide-evidence link', () => {
    const dispute: DisputeCase = inrClaimBuyerWait as DisputeCase;
    expect(dispute.status).toBe('WAITING_FOR_BUYER_RESPONSE');
    expect(dispute.dispute_life_cycle_stage).toBe('CHARGEBACK');
    expect(dispute.links?.some((l) => l.rel === 'provide-evidence')).toBe(true);
    expect(dispute.evidences?.[0].evidence_type).toBe('PROOF_OF_ITEM_NOT_RECEIVED');
  });

  it('loads valid RESOLVED stage fixture with buyer favour outcome', () => {
    const dispute: DisputeCase = inrResolved as DisputeCase;
    expect(dispute.status).toBe('RESOLVED');
    expect(dispute.dispute_outcome?.outcome_code).toBe('RESOLVED_BUYER_FAVOUR');
    expect(dispute.links).toHaveLength(0);
  });

  it('loads all evidence text fixtures with expected content', () => {
    expect(orderConfirmation).toContain('Order #DS-88492');
    expect(orderConfirmation).toContain('Total Amount: $120.00 USD');

    expect(trackingLabelOnly).toContain('Shipping Label Created, USPS Awaiting Item');
    expect(trackingLabelOnly).toContain('9400111899562837492011');

    expect(trackingDelivered).toContain('Delivered, In/At Mailbox');
    expect(trackingDelivered).toContain('9400111899562837492011');

    expect(merchantChatPromise).toContain('full refund of $120');
    expect(merchantChatPromise).toContain('#DS-88492');
  });
});
