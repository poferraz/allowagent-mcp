import { describe, it, expect } from 'vitest';
import { detectContradictions } from '../../src/domain/contradiction';
import { GroundedFact } from '../../src/types/dispute';

describe('Contradiction Engine', () => {
  it('detects seller delivery claim vs tracking label-created scan', () => {
    const facts: GroundedFact[] = [
      {
        id: 'f-merchant-claim',
        tier: 'EXTRACTED_EVIDENCE',
        label: 'Merchant Delivery Claim',
        value: 'Delivered',
        sourceDocName: 'merchant-chat.txt',
        verbatimQuote: 'Your item was delivered yesterday',
        verified: true
      },
      {
        id: 'f-tracking-scan',
        tier: 'EXTRACTED_EVIDENCE',
        label: 'Carrier Scan',
        value: 'LABEL_CREATED',
        sourceDocName: 'tracking-screenshot.png',
        verbatimQuote: 'Shipping Label Created, USPS Awaiting Item',
        verified: true
      }
    ];

    const alerts = detectContradictions(facts);
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('WARNING');
    expect(alerts[0].title).toContain('Carrier tracking contradicts seller delivery claim');
    expect(alerts[0].customerExplanation).toContain('normal');
    expect(alerts[0].conflictingFactIds).toEqual(['f-merchant-claim', 'f-tracking-scan']);
  });

  it('detects promised refund with missing refund ID', () => {
    const facts: GroundedFact[] = [
      {
        id: 'f-refund-promise',
        tier: 'EXTRACTED_EVIDENCE',
        label: 'Refund Promise',
        value: 'Full refund promised in chat',
        sourceDocName: 'merchant-chat.txt',
        verbatimQuote: 'We will issue a full refund of $120 today',
        verified: true
      },
      {
        id: 'f-refund-id',
        tier: 'PAYPAL_CASE_FACT',
        label: 'Refund ID',
        value: 'NONE',
        verified: true
      }
    ];

    const alerts = detectContradictions(facts);
    expect(alerts.length).toBe(1);
    expect(alerts[0].title).toContain('Promised refund not recorded');
    expect(alerts[0].conflictingFactIds).toEqual(['f-refund-promise', 'f-refund-id']);
  });

  it('returns empty array when facts are consistent or no contradictions exist', () => {
    const facts: GroundedFact[] = [
      {
        id: 'f-order-date',
        tier: 'PAYPAL_CASE_FACT',
        label: 'Transaction Date',
        value: '2026-09-15',
        verified: true
      },
      {
        id: 'f-carrier-scan',
        tier: 'EXTRACTED_EVIDENCE',
        label: 'Carrier Scan',
        value: 'DELIVERED',
        sourceDocName: 'tracking.png',
        verbatimQuote: 'Delivered in mailbox',
        verified: true
      }
    ];

    const alerts = detectContradictions(facts);
    expect(alerts).toEqual([]);
  });
});
