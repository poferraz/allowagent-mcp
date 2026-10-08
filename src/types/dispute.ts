import { DisputeCase, EvidenceType } from './paypal';

export type FactTier = 
  | 'PAYPAL_CASE_FACT'    // Sourced directly from official PayPal API
  | 'EXTRACTED_EVIDENCE'  // Extracted from user documents with exact citations
  | 'CUSTOMER_STATEMENT'; // Unverified customer claims from chat/Q&A

export interface GroundedFact {
  id: string;
  tier: FactTier;
  label: string;
  value: string;
  sourceDocName?: string;
  verbatimQuote?: string;
  verified: boolean;
}

export interface ChecklistItem {
  id: string;
  requiredParty: 'BUYER' | 'SELLER';
  evidenceType: EvidenceType;
  description: string;
  satisfied: boolean;
  associatedFactId?: string;
}

export interface PlainLanguageAction {
  stageDescription: string;
  deadlineText: string;
  actionOwner: 'YOU' | 'SELLER' | 'PAYPAL';
  recommendedAction: 'WAIT_FOR_SELLER' | 'SEND_MESSAGE' | 'SUBMIT_EVIDENCE' | 'ESCALATE' | 'ACCEPT_OFFER' | 'CASE_CLOSED';
  guidanceText: string;
  apiAction?: 'send-message' | 'provide-evidence' | 'escalate' | 'accept-offer';
}

export interface CaseReadiness {
  caseData: DisputeCase;
  checklist: ChecklistItem[];
  facts: GroundedFact[];
  nextAction: PlainLanguageAction;
}
