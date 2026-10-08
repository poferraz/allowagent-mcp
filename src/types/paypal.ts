export type DisputeLifeCycleStage = 
  | 'INQUIRY' 
  | 'CHARGEBACK' 
  | 'PRE_ARBITRATION' 
  | 'ARBITRATION';

export type DisputeStatus = 
  | 'OPEN' 
  | 'WAITING_FOR_BUYER_RESPONSE' 
  | 'WAITING_FOR_SELLER_RESPONSE' 
  | 'UNDER_REVIEW' 
  | 'RESOLVED';

export type DisputeReason = 
  | 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED' 
  | 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED' 
  | 'UNAUTHORISED' 
  | 'CREDIT_NOT_PROCESSED';

export type EvidenceType = 
  | 'PROOF_OF_FULFILLMENT' 
  | 'PROOF_OF_REFUND' 
  | 'PROOF_OF_ITEM_NOT_RECEIVED' 
  | 'OTHER';

export type EvidenceSource = 
  | 'REQUESTED_FROM_BUYER' 
  | 'REQUESTED_FROM_SELLER' 
  | 'SUBMITTED_BY_BUYER' 
  | 'SUBMITTED_BY_SELLER';

export interface TrackingInfo {
  carrier_name?: string;
  tracking_number?: string;
}

export interface DisputeEvidence {
  evidence_type?: EvidenceType;
  source?: EvidenceSource;
  notes?: string;
  evidence_info?: {
    tracking_info?: TrackingInfo[];
    refund_ids?: string[];
  };
  documents?: Array<{
    name: string;
    url?: string;
  }>;
}

export interface HateoasLink {
  href: string;
  rel: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
}

export interface DisputeCase {
  dispute_id: string;
  create_time: string;
  update_time: string;
  dispute_life_cycle_stage: DisputeLifeCycleStage;
  status: DisputeStatus;
  dispute_amount: {
    currency_code: string;
    value: string;
  };
  reason: DisputeReason;
  buyer_response_due_date?: string;
  seller_response_due_date?: string;
  evidences?: DisputeEvidence[];
  links?: HateoasLink[];
}
