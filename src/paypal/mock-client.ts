import inrInquiryOpen from '../../fixtures/disputes/inr-inquiry-open.json';
import inrInquirySellerWait from '../../fixtures/disputes/inr-inquiry-seller-wait.json';
import inrClaimBuyerWait from '../../fixtures/disputes/inr-claim-buyer-wait.json';
import inrResolved from '../../fixtures/disputes/inr-resolved.json';
import { DisputeCase } from '../types/paypal';
import { validateAllowedAction } from '../domain/dispute-machine';
import { WebhookEvent } from './webhooks';

export class MockPayPalClient {
  private cases: Map<string, DisputeCase> = new Map();
  private messages: Map<string, string[]> = new Map();
  private submittedEvidences: Map<string, any[]> = new Map();
  private webhookListeners: Array<(event: WebhookEvent) => void> = [];

  constructor(initialCases?: DisputeCase[]) {
    this.seedCases();
    if (initialCases) {
      for (const c of initialCases) {
        this.cases.set(c.dispute_id, JSON.parse(JSON.stringify(c)));
      }
    }
  }

  private seedCases(): void {
    this.cases.set('PP-D-1001', inrInquiryOpen as DisputeCase);
    this.cases.set('PP-D-1002', inrInquirySellerWait as DisputeCase);
    this.cases.set('PP-D-1003', inrClaimBuyerWait as DisputeCase);
    this.cases.set('PP-D-1004', inrResolved as DisputeCase);
  }

  async getDispute(disputeId: string): Promise<DisputeCase> {
    const dispute = this.cases.get(disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found in mock store`);
    }
    return JSON.parse(JSON.stringify(dispute));
  }

  async sendMessage(disputeId: string, message: string): Promise<{ success: boolean }> {
    const dispute = await this.getDispute(disputeId);
    validateAllowedAction(dispute, 'send-message');

    const list = this.messages.get(disputeId) || [];
    list.push(message);
    this.messages.set(disputeId, list);
    return { success: true };
  }

  async provideEvidence(disputeId: string, evidenceData: any): Promise<{ success: boolean }> {
    const dispute = await this.getDispute(disputeId);
    validateAllowedAction(dispute, 'provide-evidence');

    const list = this.submittedEvidences.get(disputeId) || [];
    list.push(evidenceData);
    this.submittedEvidences.set(disputeId, list);

    const stored = this.cases.get(disputeId);
    if (stored) {
      stored.update_time = new Date().toISOString();
      if (!stored.evidences) stored.evidences = [];
      stored.evidences.push({
        source: 'SUBMITTED_BY_BUYER',
        notes: evidenceData?.notes || 'Evidence submitted by buyer',
        documents: evidenceData?.documents
      });
    }

    return { success: true };
  }

  async provideSupportingInfo(disputeId: string, _info: string): Promise<{ success: boolean }> {
    const dispute = await this.getDispute(disputeId);
    validateAllowedAction(dispute, 'provide-supporting-info');
    return { success: true };
  }

  async escalate(disputeId: string, _note?: string): Promise<{ success: boolean }> {
    const dispute = await this.getDispute(disputeId);
    validateAllowedAction(dispute, 'escalate');

    const stored = this.cases.get(disputeId);
    if (stored) {
      stored.dispute_life_cycle_stage = 'CHARGEBACK';
      stored.update_time = new Date().toISOString();
    }
    return { success: true };
  }

  getSubmittedMessages(disputeId: string): string[] {
    return [...(this.messages.get(disputeId) || [])];
  }

  getSubmittedEvidences(disputeId: string): any[] {
    return [...(this.submittedEvidences.get(disputeId) || [])];
  }

  onWebhook(listener: (event: WebhookEvent) => void): () => void {
    this.webhookListeners.push(listener);
    return () => {
      this.webhookListeners = this.webhookListeners.filter(l => l !== listener);
    };
  }

  dispatchWebhook(event: WebhookEvent): void {
    if (this.cases.has(event.disputeId) && event.resource) {
      const existing = this.cases.get(event.disputeId)!;
      this.cases.set(event.disputeId, {
        ...existing,
        ...event.resource,
        update_time: new Date().toISOString()
      });
    } else if (event.eventType === 'CUSTOMER.DISPUTE.CREATED' && event.resource?.dispute_id) {
      this.cases.set(event.resource.dispute_id, event.resource as DisputeCase);
    }

    for (const listener of this.webhookListeners) {
      listener(event);
    }
  }
}
