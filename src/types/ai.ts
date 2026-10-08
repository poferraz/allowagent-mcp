export interface ContradictionAlert {
  id: string;
  severity: 'WARNING' | 'BLOCKER';
  title: string;
  customerExplanation: string;
  impactOnCase: string;
  suggestedCorrection: string;
  conflictingFactIds: [string, string];
}

export interface ExtractedDocumentData {
  documentName: string;
  extractedDate?: string;
  merchantName?: string;
  amount?: string;
  trackingNumber?: string;
  carrierName?: string;
  deliveryStatus?: 'LABEL_CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'UNKNOWN';
  refundPromised?: boolean;
  refundAmount?: string;
  rawExcerpt: string;
}
