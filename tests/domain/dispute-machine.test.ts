import { describe, it, expect } from 'vitest';
import { deriveCaseReadiness, validateAllowedAction, InvalidDisputeActionError } from '../../src/domain/dispute-machine';
import inrInquiryOpen from '../../fixtures/disputes/inr-inquiry-open.json';
import inrInquirySellerWait from '../../fixtures/disputes/inr-inquiry-seller-wait.json';
import inrClaimBuyerWait from '../../fixtures/disputes/inr-claim-buyer-wait.json';
import inrResolved from '../../fixtures/disputes/inr-resolved.json';
import { DisputeCase } from '../../src/types/paypal';

describe('Dispute State Machine', () => {
  describe('deriveCaseReadiness', () => {
    it('correctly maps INQUIRY + WAITING_FOR_SELLER_RESPONSE to seller on the clock', () => {
      const readiness = deriveCaseReadiness(inrInquirySellerWait as DisputeCase);
      expect(readiness.nextAction.actionOwner).toBe('SELLER');
      expect(readiness.nextAction.recommendedAction).toBe('WAIT_FOR_SELLER');
      expect(readiness.nextAction.guidanceText).toContain('PayPal is currently asking the seller');
      expect(readiness.checklist.length).toBeGreaterThan(0);
      expect(readiness.facts.find(f => f.id === 'f-case-id')?.value).toBe('PP-D-1002');
    });

    it('correctly maps WAITING_FOR_BUYER_RESPONSE to buyer evidence submission', () => {
      const readiness = deriveCaseReadiness(inrClaimBuyerWait as DisputeCase);
      expect(readiness.nextAction.actionOwner).toBe('YOU');
      expect(readiness.nextAction.recommendedAction).toBe('SUBMIT_EVIDENCE');
      expect(readiness.nextAction.apiAction).toBe('provide-evidence');
      expect(readiness.nextAction.deadlineText).toContain('Due by');
    });

    it('marks case closed when RESOLVED', () => {
      const readiness = deriveCaseReadiness(inrResolved as DisputeCase);
      expect(readiness.nextAction.recommendedAction).toBe('CASE_CLOSED');
      expect(readiness.nextAction.actionOwner).toBe('PAYPAL');
      expect(readiness.nextAction.deadlineText).toBe('No deadline pending.');
    });

    it('handles open inquiry defaults with INR fallback checklist', () => {
      const readiness = deriveCaseReadiness(inrInquiryOpen as DisputeCase);
      expect(readiness.nextAction.actionOwner).toBe('YOU');
      expect(readiness.nextAction.recommendedAction).toBe('SEND_MESSAGE');
      expect(readiness.checklist).toHaveLength(2);
      expect(readiness.facts).toHaveLength(4);
    });
  });

  describe('validateAllowedAction', () => {
    it('allows send-message in INQUIRY stage and rejects provide-supporting-info', () => {
      expect(() => validateAllowedAction(inrInquiryOpen as DisputeCase, 'send-message')).not.toThrow();
      
      expect(() => validateAllowedAction(inrInquiryOpen as DisputeCase, 'provide-supporting-info'))
        .toThrow(InvalidDisputeActionError);
    });

    it('allows provide-evidence only when WAITING_FOR_BUYER_RESPONSE', () => {
      expect(() => validateAllowedAction(inrClaimBuyerWait as DisputeCase, 'provide-evidence')).not.toThrow();
      
      expect(() => validateAllowedAction(inrInquiryOpen as DisputeCase, 'provide-evidence'))
        .toThrow(InvalidDisputeActionError);
    });

    it('allows provide-supporting-info only in CHARGEBACK, PRE_ARBITRATION, or ARBITRATION', () => {
      expect(() => validateAllowedAction(inrClaimBuyerWait as DisputeCase, 'provide-supporting-info')).not.toThrow();
      expect(() => validateAllowedAction(inrInquiryOpen as DisputeCase, 'provide-supporting-info'))
        .toThrow(/prohibited in INQUIRY stage/);
    });

    it('rejects send-message outside INQUIRY stage', () => {
      expect(() => validateAllowedAction(inrClaimBuyerWait as DisputeCase, 'send-message'))
        .toThrow(/only valid during INQUIRY stage/);
    });

    it('allows escalate only from INQUIRY stage', () => {
      expect(() => validateAllowedAction(inrInquiryOpen as DisputeCase, 'escalate')).not.toThrow();
      expect(() => validateAllowedAction(inrClaimBuyerWait as DisputeCase, 'escalate'))
        .toThrow(/can only be performed from INQUIRY stage/);
    });

    it('enforces require-evidence invariant: only when UNDER_REVIEW', () => {
      const underReviewCase: DisputeCase = {
        ...(inrClaimBuyerWait as DisputeCase),
        status: 'UNDER_REVIEW'
      };
      expect(() => validateAllowedAction(underReviewCase, 'require-evidence')).not.toThrow();
      expect(() => validateAllowedAction(inrClaimBuyerWait as DisputeCase, 'require-evidence'))
        .toThrow(/requires status UNDER_REVIEW/);
    });
  });
});
