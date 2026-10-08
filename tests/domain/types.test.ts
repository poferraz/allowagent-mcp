import { describe, it, expect } from 'vitest';
import { DisputeCase, DisputeEvidence, TrackingInfo, HateoasLink } from '../../src/types/paypal';
import { GroundedFact, ChecklistItem, CaseReadiness, PlainLanguageAction } from '../../src/types/dispute';
import { ContradictionAlert, ExtractedDocumentData } from '../../src/types/ai';

describe('Type Definitions and Invariants', () => {
  it('instantiates valid DisputeCase without errors', () => {
    const mockCase: DisputeCase = {
      dispute_id: 'PP-D-12345',
      create_time: '2026-10-01T12:00:00Z',
      update_time: '2026-10-01T12:00:00Z',
      dispute_life_cycle_stage: 'INQUIRY',
      status: 'OPEN',
      dispute_amount: { currency_code: 'USD', value: '45.00' },
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    };
    expect(mockCase.dispute_id).toBe('PP-D-12345');
    expect(mockCase.dispute_life_cycle_stage).toBe('INQUIRY');
    expect(mockCase.status).toBe('OPEN');
    expect(mockCase.dispute_amount.value).toBe('45.00');
  });

  it('supports full dispute evidence structure with tracking and documents', () => {
    const tracking: TrackingInfo = {
      carrier_name: 'USPS',
      tracking_number: '9400100000000000000000',
    };

    const evidence: DisputeEvidence = {
      evidence_type: 'PROOF_OF_ITEM_NOT_RECEIVED',
      source: 'SUBMITTED_BY_BUYER',
      notes: 'Package never delivered according to carrier tracking',
      evidence_info: {
        tracking_info: [tracking],
        refund_ids: ['REF-123'],
      },
      documents: [
        {
          name: 'tracking_status.pdf',
          url: 'https://example.com/docs/tracking_status.pdf',
        },
      ],
    };

    const link: HateoasLink = {
      href: 'https://api.sandbox.paypal.com/v1/customer/disputes/PP-D-12345/send-message',
      rel: 'send_message',
      method: 'POST',
    };

    expect(evidence.evidence_type).toBe('PROOF_OF_ITEM_NOT_RECEIVED');
    expect(evidence.evidence_info?.tracking_info?.[0].carrier_name).toBe('USPS');
    expect(link.method).toBe('POST');
  });

  it('enforces 3-tier fact categorization', () => {
    const fact: GroundedFact = {
      id: 'f-1',
      tier: 'EXTRACTED_EVIDENCE',
      label: 'Delivery Scan',
      value: 'None (Label created only)',
      sourceDocName: 'tracking_screenshot.png',
      verbatimQuote: 'Shipping Label Created, USPS Awaiting Item',
      verified: true,
    };
    expect(fact.tier).toBe('EXTRACTED_EVIDENCE');
    expect(fact.verbatimQuote).toBe('Shipping Label Created, USPS Awaiting Item');

    const customerClaim: GroundedFact = {
      id: 'f-2',
      tier: 'CUSTOMER_STATEMENT',
      label: 'Buyer Explanation',
      value: 'I waited 3 weeks and nothing arrived',
      verified: false,
    };
    expect(customerClaim.tier).toBe('CUSTOMER_STATEMENT');
    expect(customerClaim.verified).toBe(false);

    const paypalFact: GroundedFact = {
      id: 'f-3',
      tier: 'PAYPAL_CASE_FACT',
      label: 'Dispute Status',
      value: 'UNDER_REVIEW',
      verified: true,
    };
    expect(paypalFact.tier).toBe('PAYPAL_CASE_FACT');
  });

  it('structures checklist items and case readiness model', () => {
    const checklistItem: ChecklistItem = {
      id: 'chk-1',
      requiredParty: 'BUYER',
      evidenceType: 'PROOF_OF_ITEM_NOT_RECEIVED',
      description: 'Carrier confirmation of non-delivery or tracking stalled',
      satisfied: true,
      associatedFactId: 'f-1',
    };

    const action: PlainLanguageAction = {
      stageDescription: 'Under Review by PayPal',
      deadlineText: 'No action required right now',
      actionOwner: 'PAYPAL',
      recommendedAction: 'WAIT_FOR_SELLER',
      guidanceText: 'PayPal is reviewing the submitted evidence from both parties.',
    };

    const readiness: CaseReadiness = {
      caseData: {
        dispute_id: 'PP-D-999',
        create_time: '2026-10-01T00:00:00Z',
        update_time: '2026-10-02T00:00:00Z',
        dispute_life_cycle_stage: 'INQUIRY',
        status: 'UNDER_REVIEW',
        dispute_amount: { currency_code: 'USD', value: '120.00' },
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      },
      checklist: [checklistItem],
      facts: [],
      nextAction: action,
    };

    expect(readiness.checklist[0].satisfied).toBe(true);
    expect(readiness.nextAction.actionOwner).toBe('PAYPAL');
  });

  it('validates AI extraction and contradiction models', () => {
    const docData: ExtractedDocumentData = {
      documentName: 'usps_tracking.png',
      extractedDate: '2026-10-05',
      trackingNumber: '9400100000000000000000',
      carrierName: 'USPS',
      deliveryStatus: 'LABEL_CREATED',
      rawExcerpt: 'Shipping Label Created, USPS Awaiting Item',
    };

    const alert: ContradictionAlert = {
      id: 'alert-1',
      severity: 'BLOCKER',
      title: 'Contradiction between Claim and Tracking Status',
      customerExplanation: 'Buyer stated item was returned, but tracking shows label only created.',
      impactOnCase: 'PayPal dispute reviewer may reject refund claim.',
      suggestedCorrection: 'Verify whether package was dropped off or clarify statement.',
      conflictingFactIds: ['fact-1', 'fact-2'],
    };

    expect(docData.deliveryStatus).toBe('LABEL_CREATED');
    expect(alert.severity).toBe('BLOCKER');
    expect(alert.conflictingFactIds).toHaveLength(2);
  });
});
