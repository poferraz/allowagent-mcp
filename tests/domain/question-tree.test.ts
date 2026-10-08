import { describe, it, expect } from 'vitest';
import { getNextQuestion, QuestionContext } from '../../src/domain/question-tree';

describe('Adaptive Question Tree & Escalation Logic', () => {
  it('stops if payment is older than 180 days', () => {
    const context: QuestionContext = {
      hasExistingDispute: false,
      daysSincePayment: 181,
      uploadedRecords: [],
      deliveryScanKnown: false
    };

    const nextQ = getNextQuestion(context);
    expect(nextQ?.id).toBe('STOP_180_DAYS_EXPIRED');
    expect(nextQ?.isGuidanceOnly).toBe(true);
    expect(nextQ?.text).toContain("180-day");
  });

  it('asks triage reason when no existing dispute and reason unknown', () => {
    const context: QuestionContext = {
      hasExistingDispute: false,
      daysSincePayment: 20,
      uploadedRecords: [],
      deliveryScanKnown: false
    };

    const nextQ = getNextQuestion(context);
    expect(nextQ?.id).toBe('Q_TRIAGE_REASON');
    expect(nextQ?.options).toContain('Item never arrived (INR)');
  });

  it('skips Q1 when dispute already exists and reason is known', () => {
    const context: QuestionContext = {
      hasExistingDispute: true,
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      daysSincePayment: 15,
      inquiryDaysElapsed: 3,
      uploadedRecords: [],
      deliveryScanKnown: false
    };

    const nextQ = getNextQuestion(context);
    expect(nextQ?.id).toBe('Q_RECORDS_UPLOAD');
  });

  it('prompts for delivery scan if records uploaded but delivery scan is unknown', () => {
    const context: QuestionContext = {
      hasExistingDispute: true,
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      daysSincePayment: 15,
      inquiryDaysElapsed: 3,
      uploadedRecords: ['order-confirmation.pdf'],
      deliveryScanKnown: false
    };

    const nextQ = getNextQuestion(context);
    expect(nextQ?.id).toBe('Q_DELIVERY_SCAN');
    expect(nextQ?.options).toContain('No delivery scan / stuck in transit');
  });

  it('provides Accelerated Response escalation guidance on Day 9 with seller message', () => {
    const context: QuestionContext = {
      hasExistingDispute: true,
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      daysSincePayment: 25,
      inquiryDaysElapsed: 9,
      sellerContacted: true,
      uploadedRecords: ['order', 'tracking'],
      deliveryScanKnown: true
    };

    const nextQ = getNextQuestion(context);
    expect(nextQ?.id).toBe('GUIDANCE_ACCELERATED_ESCALATION');
    expect(nextQ?.text).toContain('Accelerated Response window');
    expect(nextQ?.text).toContain('Day 9');
    expect(nextQ?.isGuidanceOnly).toBe(true);
  });

  it('dynamically interpolates Day 8 in Accelerated Response guidance', () => {
    const context: QuestionContext = {
      hasExistingDispute: true,
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      daysSincePayment: 25,
      inquiryDaysElapsed: 8,
      sellerContacted: true,
      uploadedRecords: ['order', 'tracking'],
      deliveryScanKnown: true
    };

    const nextQ = getNextQuestion(context);
    expect(nextQ?.id).toBe('GUIDANCE_ACCELERATED_ESCALATION');
    expect(nextQ?.text).toContain('Day 8');
  });

  it('returns null when all required info is collected outside accelerated response window', () => {
    const context: QuestionContext = {
      hasExistingDispute: true,
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      daysSincePayment: 25,
      inquiryDaysElapsed: 2,
      sellerContacted: true,
      uploadedRecords: ['order', 'tracking'],
      deliveryScanKnown: true
    };

    const nextQ = getNextQuestion(context);
    expect(nextQ).toBeNull();
  });
});
