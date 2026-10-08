import { DisputeCase } from '../types/paypal';
import { CaseReadiness, PlainLanguageAction, ChecklistItem, GroundedFact } from '../types/dispute';

export class InvalidDisputeActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDisputeActionError';
  }
}

export type DisputeAction =
  | 'send-message'
  | 'provide-evidence'
  | 'provide-supporting-info'
  | 'escalate'
  | 'require-evidence';

export function validateAllowedAction(caseData: DisputeCase, action: DisputeAction | string): void {
  const stage = caseData.dispute_life_cycle_stage;
  const status = caseData.status;

  if (action === 'provide-supporting-info') {
    if (stage === 'INQUIRY') {
      throw new InvalidDisputeActionError(
        `Action 'provide-supporting-info' is prohibited in INQUIRY stage. Use 'send-message' for buyer-seller messaging.`
      );
    }
    if (stage !== 'CHARGEBACK' && stage !== 'PRE_ARBITRATION' && stage !== 'ARBITRATION') {
      throw new InvalidDisputeActionError(
        `Action 'provide-supporting-info' requires CHARGEBACK, PRE_ARBITRATION, or ARBITRATION stage.`
      );
    }
  }

  if (action === 'provide-evidence') {
    if (status !== 'WAITING_FOR_BUYER_RESPONSE') {
      throw new InvalidDisputeActionError(
        `Action 'provide-evidence' requires status WAITING_FOR_BUYER_RESPONSE (current status: ${status}).`
      );
    }
  }

  if (action === 'send-message') {
    if (stage !== 'INQUIRY') {
      throw new InvalidDisputeActionError(
        `Action 'send-message' is only valid during INQUIRY stage (current stage: ${stage}).`
      );
    }
  }

  if (action === 'escalate') {
    if (stage !== 'INQUIRY') {
      throw new InvalidDisputeActionError(
        `Action 'escalate' can only be performed from INQUIRY stage.`
      );
    }
  }

  if (action === 'require-evidence') {
    if (status !== 'UNDER_REVIEW') {
      throw new InvalidDisputeActionError(
        `Action 'require-evidence' requires status UNDER_REVIEW (current status: ${status}).`
      );
    }
  }
}

export function deriveCaseReadiness(caseData: DisputeCase): CaseReadiness {
  const facts: GroundedFact[] = [
    {
      id: 'f-case-id',
      tier: 'PAYPAL_CASE_FACT',
      label: 'Case ID',
      value: caseData.dispute_id,
      verified: true
    },
    {
      id: 'f-case-stage',
      tier: 'PAYPAL_CASE_FACT',
      label: 'Stage',
      value: caseData.dispute_life_cycle_stage,
      verified: true
    },
    {
      id: 'f-case-status',
      tier: 'PAYPAL_CASE_FACT',
      label: 'Status',
      value: caseData.status,
      verified: true
    },
    {
      id: 'f-case-amount',
      tier: 'PAYPAL_CASE_FACT',
      label: 'Dispute Amount',
      value: `$${caseData.dispute_amount.value} ${caseData.dispute_amount.currency_code}`,
      verified: true
    }
  ];

  const checklist: ChecklistItem[] = [];
  if (caseData.evidences && caseData.evidences.length > 0) {
    caseData.evidences.forEach((ev, idx) => {
      checklist.push({
        id: `ev-${idx}`,
        requiredParty: ev.source === 'REQUESTED_FROM_BUYER' ? 'BUYER' : 'SELLER',
        evidenceType: ev.evidence_type || 'OTHER',
        description: ev.source === 'REQUESTED_FROM_BUYER'
          ? 'Upload proof of item not received (tracking screenshot showing no delivery scan)'
          : 'Seller must provide proof of fulfillment or refund ID',
        satisfied: ev.source?.startsWith('SUBMITTED_') || false
      });
    });
  } else if (caseData.reason === 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED') {
    checklist.push(
      {
        id: 'chk-inr-seller',
        requiredParty: 'SELLER',
        evidenceType: 'PROOF_OF_FULFILLMENT',
        description: 'Proof of fulfillment (valid carrier tracking scan) or refund ID',
        satisfied: false
      },
      {
        id: 'chk-inr-buyer',
        requiredParty: 'BUYER',
        evidenceType: 'PROOF_OF_ITEM_NOT_RECEIVED',
        description: 'Proof of non-receipt (order details & tracking showing no delivery)',
        satisfied: false
      }
    );
  }

  let nextAction: PlainLanguageAction;

  if (caseData.status === 'RESOLVED') {
    nextAction = {
      stageDescription: 'Case closed.',
      deadlineText: 'No deadline pending.',
      actionOwner: 'PAYPAL',
      recommendedAction: 'CASE_CLOSED',
      guidanceText: 'This dispute has been resolved by PayPal. See outcome details below.'
    };
  } else if (caseData.status === 'UNDER_REVIEW') {
    nextAction = {
      stageDescription: 'Under Review by PayPal.',
      deadlineText: 'Review in progress',
      actionOwner: 'PAYPAL',
      recommendedAction: 'WAIT_FOR_PAYPAL',
      guidanceText: 'PayPal is actively reviewing the evidence provided by both parties. A decision will typically be rendered within 10 days.'
    };
  } else if (caseData.status === 'WAITING_FOR_BUYER_RESPONSE') {
    nextAction = {
      stageDescription: 'PayPal is waiting for your response.',
      deadlineText: caseData.buyer_response_due_date
        ? `Due by ${caseData.buyer_response_due_date.slice(0, 10)}`
        : 'Response required',
      actionOwner: 'YOU',
      recommendedAction: 'SUBMIT_EVIDENCE',
      guidanceText: 'PayPal has asked you for documentation. Submit your tracking screenshot and order details.',
      apiAction: 'provide-evidence'
    };
  } else if (caseData.status === 'WAITING_FOR_SELLER_RESPONSE') {
    nextAction = {
      stageDescription: 'Conversation stage (Inquiry).',
      deadlineText: caseData.seller_response_due_date
        ? `Seller response due by ${caseData.seller_response_due_date.slice(0, 10)}`
        : 'Waiting on seller',
      actionOwner: 'SELLER',
      recommendedAction: 'WAIT_FOR_SELLER',
      guidanceText: 'PayPal is currently asking the seller for tracking or refund proof. You are not on the clock.',
      apiAction: 'send-message'
    };
  } else {
    nextAction = {
      stageDescription: 'Conversation stage (Inquiry).',
      deadlineText: caseData.buyer_response_due_date
        ? `Window open until ${caseData.buyer_response_due_date.slice(0, 10)}`
        : '20-day inquiry window',
      actionOwner: 'YOU',
      recommendedAction: 'SEND_MESSAGE',
      guidanceText: 'You can message the seller directly to request updates or an amicable resolution.',
      apiAction: 'send-message'
    };
  }

  return {
    caseData,
    checklist,
    facts,
    nextAction
  };
}
