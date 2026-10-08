import { describe, it, expect } from 'vitest';
import { assembleDraftResponse, generateApprovalDiff } from '../../src/domain/response-draft';
import { GroundedFact } from '../../src/types/dispute';

describe('Response Drafter and Approval Gate', () => {
  it('assembles neutral factual draft with source citations', () => {
    const facts: GroundedFact[] = [
      {
        id: 'f-1',
        tier: 'EXTRACTED_EVIDENCE',
        label: 'Order Date',
        value: 'October 1, 2026',
        sourceDocName: 'order-confirmation.txt',
        verbatimQuote: 'Date: October 1, 2026',
        verified: true
      },
      {
        id: 'f-2',
        tier: 'EXTRACTED_EVIDENCE',
        label: 'Tracking Status',
        value: 'Label Created, no delivery scan',
        sourceDocName: 'tracking-label-only.txt',
        verbatimQuote: 'Status: Shipping Label Created, USPS Awaiting Item',
        verified: true
      }
    ];

    const draft = assembleDraftResponse(facts);
    expect(draft.text).toContain('Order placed on October 1, 2026');
    expect(draft.text).toContain('no delivery scan');
    expect(draft.citations.length).toBe(2);
    expect(draft.citations[0]).toEqual({
      factId: 'f-1',
      sourceDocName: 'order-confirmation.txt',
      quote: 'Date: October 1, 2026'
    });
    expect(draft.citations[1]).toEqual({
      factId: 'f-2',
      sourceDocName: 'tracking-label-only.txt',
      quote: 'Status: Shipping Label Created, USPS Awaiting Item'
    });
    expect(draft.text).not.toMatch(/liar|stolen|scam/i);
    expect(draft.text).not.toMatch(/guarantee|win|promise.*money back/i);
    expect(draft.payloadHash).toBeDefined();
    expect(draft.payloadHash).toMatch(/^h-[0-9a-f]+$/);
  });

  it('includes refund promise in draft response when present', () => {
    const facts: GroundedFact[] = [
      {
        id: 'f-refund',
        tier: 'EXTRACTED_EVIDENCE',
        label: 'Refund Promise',
        value: '$120 via PayPal',
        sourceDocName: 'seller-chat.txt',
        verbatimQuote: 'We will refund your $120 via PayPal within 48h',
        verified: true
      }
    ];

    const draft = assembleDraftResponse(facts);
    expect(draft.text).toContain('Merchant communication promised refund ($120 via PayPal)');
    expect(draft.citations).toHaveLength(1);
    expect(draft.citations[0].factId).toBe('f-refund');
  });

  it('handles facts without source document quotes gracefully without adding invalid citations', () => {
    const facts: GroundedFact[] = [
      {
        id: 'f-order',
        tier: 'CUSTOMER_STATEMENT',
        label: 'Order Date',
        value: 'September 28, 2026',
        verified: false
      }
    ];

    const draft = assembleDraftResponse(facts);
    expect(draft.text).toContain('Order placed on September 28, 2026');
    expect(draft.citations).toHaveLength(0);
  });

  it('handles empty facts list by returning neutral investigation request', () => {
    const draft = assembleDraftResponse([]);
    expect(draft.text).toContain('Respectfully requesting investigation');
    expect(draft.citations).toEqual([]);
    expect(draft.payloadHash).toBeDefined();
  });

  it('generates approval diff detecting customer edits', () => {
    const original = 'Order placed on October 1, 2026.';
    const edited = 'Order placed on October 1, 2026 for a standing desk.';
    const diff = generateApprovalDiff(original, edited);
    expect(diff.hasModifications).toBe(true);
    expect(diff.original).toBe(original);
    expect(diff.edited).toBe(edited);
    expect(diff.payloadHash).toBeDefined();
    expect(diff.payloadHash).toMatch(/^h-[0-9a-f]+$/);
  });

  it('generates approval diff detecting identical content without modifications', () => {
    const text = 'Order placed on October 1, 2026. Respectfully requesting investigation.';
    const diff = generateApprovalDiff(text, text);
    expect(diff.hasModifications).toBe(false);
    expect(diff.original).toBe(text);
    expect(diff.edited).toBe(text);
  });

  it('treats whitespace-only difference as no modification', () => {
    const original = 'Order placed on October 1, 2026. ';
    const edited = 'Order placed on October 1, 2026.\n';
    const diff = generateApprovalDiff(original, edited);
    expect(diff.hasModifications).toBe(false);
  });

  it('produces deterministic hash for identical text and distinct hash for different text', () => {
    const diff1 = generateApprovalDiff('Text A', 'Text A');
    const diff2 = generateApprovalDiff('Text B', 'Text A');
    const diff3 = generateApprovalDiff('Text A', 'Text B');

    expect(diff1.payloadHash).toBe(diff2.payloadHash);
    expect(diff1.payloadHash).not.toBe(diff3.payloadHash);
  });
});
