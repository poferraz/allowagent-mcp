import { GroundedFact } from '../types/dispute';
import { ContradictionAlert } from '../types/ai';

export function detectContradictions(facts: GroundedFact[]): ContradictionAlert[] {
  const alerts: ContradictionAlert[] = [];

  const merchantDelivery = facts.find(
    f => f.label.toLowerCase().includes('merchant delivery') && f.value.toLowerCase().includes('delivered')
  );
  const trackingScan = facts.find(
    f => f.label.toLowerCase().includes('carrier scan') || f.label.toLowerCase().includes('tracking')
  );

  if (merchantDelivery && trackingScan) {
    const isUndeliveredTracking =
      trackingScan.value.includes('LABEL_CREATED') ||
      trackingScan.value.toLowerCase().includes('no delivery scan') ||
      trackingScan.value.includes('Awaiting Item');

    if (isUndeliveredTracking) {
      alerts.push({
        id: 'contra-delivery-vs-tracking',
        severity: 'WARNING',
        title: 'Carrier tracking contradicts seller delivery claim',
        customerExplanation:
          'The seller message says delivered, but the official carrier record shows the package was never scanned as delivered. This is normal and strongly supports your Item Not Received case.',
        impactOnCase: 'PayPal requires verified carrier delivery scans for merchant defense.',
        suggestedCorrection: 'Highlight the tracking screenshot as the authoritative record in your draft.',
        conflictingFactIds: [merchantDelivery.id, trackingScan.id]
      });
    }
  }

  const refundPromise = facts.find(
    f => f.label.toLowerCase().includes('refund') && (f.value.toLowerCase().includes('promised') || f.value.toLowerCase().includes('will issue'))
  );
  const refundId = facts.find(
    f => f.label.toLowerCase().includes('refund id') && f.value.toLowerCase().includes('none')
  );

  if (refundPromise && refundId) {
    alerts.push({
      id: 'contra-refund-unprocessed',
      severity: 'WARNING',
      title: 'Promised refund not recorded',
      customerExplanation:
        'The seller promised a refund in chat, but no refund transaction exists with PayPal. Keeping the dispute active preserves your protection.',
      impactOnCase: 'If you close the dispute before the refund settles, you cannot reopen it.',
      suggestedCorrection: 'Cite the seller chat date and promised refund in your factual summary.',
      conflictingFactIds: [refundPromise.id, refundId.id]
    });
  }

  return alerts;
}
