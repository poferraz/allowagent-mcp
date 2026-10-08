import { GroundedFact } from '../types/dispute';

export interface DraftCitation {
  factId: string;
  sourceDocName: string;
  quote: string;
}

export interface DraftResponse {
  text: string;
  citations: DraftCitation[];
  payloadHash: string;
}

export interface ApprovalDiff {
  original: string;
  edited: string;
  hasModifications: boolean;
  payloadHash: string;
}

function computeSimpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash |= 0;
  }
  return 'h-' + Math.abs(hash).toString(16);
}

export function assembleDraftResponse(facts: GroundedFact[]): DraftResponse {
  const citations: DraftCitation[] = [];
  const lines: string[] = [];

  const orderDate = facts.find(f => f.label.toLowerCase().includes('order date'));
  if (orderDate) {
    lines.push(`Order placed on ${orderDate.value}.`);
    if (orderDate.sourceDocName && orderDate.verbatimQuote) {
      citations.push({
        factId: orderDate.id,
        sourceDocName: orderDate.sourceDocName,
        quote: orderDate.verbatimQuote
      });
    }
  }

  const tracking = facts.find(f => f.label.toLowerCase().includes('tracking'));
  if (tracking) {
    lines.push(`Carrier record indicates: ${tracking.value}. No proof of completed delivery exists.`);
    if (tracking.sourceDocName && tracking.verbatimQuote) {
      citations.push({
        factId: tracking.id,
        sourceDocName: tracking.sourceDocName,
        quote: tracking.verbatimQuote
      });
    }
  }

  const refundPromise = facts.find(f => f.label.toLowerCase().includes('refund'));
  if (refundPromise) {
    lines.push(`Merchant communication promised refund (${refundPromise.value}), which has not posted to the account.`);
    if (refundPromise.sourceDocName && refundPromise.verbatimQuote) {
      citations.push({
        factId: refundPromise.id,
        sourceDocName: refundPromise.sourceDocName,
        quote: refundPromise.verbatimQuote
      });
    }
  }

  lines.push('Respectfully requesting investigation and resolution based on verified carrier non-delivery.');

  const text = lines.join(' ');
  return {
    text,
    citations,
    payloadHash: computeSimpleHash(text)
  };
}

export function generateApprovalDiff(original: string, edited: string): ApprovalDiff {
  return {
    original,
    edited,
    hasModifications: original.trim() !== edited.trim(),
    payloadHash: computeSimpleHash(edited)
  };
}
