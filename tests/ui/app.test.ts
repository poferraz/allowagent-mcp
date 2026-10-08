import { describe, it, expect } from 'vitest';
import { assembleDraftResponse, generateApprovalDiff } from '../../src/domain/response-draft';
import { detectContradictions } from '../../src/domain/contradiction';
import { GroundedFact } from '../../src/types/dispute';
import { App } from '../../src/ui/App';
import { CaseHeader } from '../../src/ui/components/CaseHeader';
import { ChecklistMatrix } from '../../src/ui/components/ChecklistMatrix';
import { ApprovalModal } from '../../src/ui/components/ApprovalModal';
import { ResponseDraftView } from '../../src/ui/components/ResponseDraftView';

describe('UI Integration Sanity', () => {
  const demoFacts: GroundedFact[] = [
    {
      id: 'f-order',
      tier: 'EXTRACTED_EVIDENCE',
      label: 'Order Date',
      value: 'October 1, 2026',
      sourceDocName: 'order-confirmation.txt',
      verbatimQuote: 'Date: October 1, 2026',
      verified: true
    },
    {
      id: 'f-tracking',
      tier: 'EXTRACTED_EVIDENCE',
      label: 'Carrier Scan',
      value: 'LABEL_CREATED (no delivery scan)',
      sourceDocName: 'tracking-label-only.txt',
      verbatimQuote: 'Status: Shipping Label Created, USPS Awaiting Item',
      verified: true
    },
    {
      id: 'f-merchant',
      tier: 'EXTRACTED_EVIDENCE',
      label: 'Merchant Delivery Claim',
      value: 'Delivered',
      sourceDocName: 'merchant-chat-promise.txt',
      verbatimQuote: 'The carrier lost the package. We will issue a full refund of $120',
      verified: true
    }
  ];

  it('generates non-empty draft text for demo facts', () => {
    const draft = assembleDraftResponse([
      {
        id: 'f-1',
        tier: 'EXTRACTED_EVIDENCE',
        label: 'Order Date',
        value: 'October 1, 2026',
        verified: true
      }
    ]);
    expect(draft.text.length).toBeGreaterThan(10);
  });

  it('produces draft with valid citations for all demo facts', () => {
    const draft = assembleDraftResponse(demoFacts);
    expect(draft.text).toContain('October 1, 2026');
    expect(draft.text).toContain('LABEL_CREATED (no delivery scan)');
    expect(draft.citations.length).toBeGreaterThanOrEqual(2);
    expect(draft.payloadHash).toMatch(/^h-[0-9a-f]+$/);
  });

  it('detects contradictions in demo fact set', () => {
    const alerts = detectContradictions(demoFacts);
    expect(alerts.length).toBe(1);
    expect(alerts[0].id).toBe('contra-delivery-vs-tracking');
    expect(alerts[0].title).toContain('Carrier tracking contradicts seller delivery claim');
  });

  it('tracks modifications in approval diff when user edits draft', () => {
    const original = assembleDraftResponse(demoFacts).text;
    const modified = original + ' Additional note.';
    const diff = generateApprovalDiff(original, modified);

    expect(diff.hasModifications).toBe(true);
    expect(diff.original).toBe(original);
    expect(diff.edited).toBe(modified);
    expect(diff.payloadHash).not.toBe('');
  });

  it('exports valid React components for CaseReady UI architecture', () => {
    expect(typeof App).toBe('function');
    expect(typeof CaseHeader).toBe('function');
    expect(typeof ChecklistMatrix).toBe('function');
    expect(typeof ApprovalModal).toBe('function');
    expect(typeof ResponseDraftView).toBe('function');
  });
});
