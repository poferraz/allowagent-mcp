export interface QuestionContext {
  hasExistingDispute: boolean;
  reason?: string;
  daysSincePayment?: number;
  inquiryDaysElapsed?: number;
  sellerContacted?: boolean;
  uploadedRecords: string[];
  deliveryScanKnown: boolean;
}

export interface QuestionPrompt {
  id: string;
  text: string;
  rationale: string;
  options?: string[];
  isGuidanceOnly?: boolean;
}

export function getNextQuestion(ctx: QuestionContext): QuestionPrompt | null {
  if (ctx.daysSincePayment !== undefined && ctx.daysSincePayment > 180) {
    return {
      id: 'STOP_180_DAYS_EXPIRED',
      text: "The payment date is beyond PayPal's 180-day dispute window.",
      rationale: "PayPal terms require disputes to be opened within 180 days of payment.",
      isGuidanceOnly: true
    };
  }

  if (!ctx.hasExistingDispute && !ctx.reason) {
    return {
      id: 'Q_TRIAGE_REASON',
      text: "What is the primary issue with your purchase?",
      rationale: "The dispute reason dictates PayPal's deadlines and required evidence.",
      options: [
        "Item never arrived (INR)",
        "Item different than described (SNAD)",
        "Unauthorized charge",
        "Something else"
      ]
    };
  }

  if (ctx.uploadedRecords.length === 0) {
    return {
      id: 'Q_RECORDS_UPLOAD',
      text: "Which records do you have on hand?",
      rationale: "Extracting facts directly from your files avoids answering repetitive questions.",
      options: [
        "Order confirmation email",
        "Messages/chat with seller",
        "Carrier tracking page/screenshot",
        "Refund confirmation"
      ]
    };
  }

  if (!ctx.deliveryScanKnown) {
    return {
      id: 'Q_DELIVERY_SCAN',
      text: "Does your tracking link show a completed delivery scan to your address?",
      rationale: "A missing delivery scan is the decisive fact in an Item Not Received case.",
      options: ["No delivery scan / stuck in transit", "Shows delivered"]
    };
  }

  // Accelerated Response guidance (Day 8–10)
  if (ctx.inquiryDaysElapsed !== undefined && ctx.inquiryDaysElapsed >= 8 && ctx.inquiryDaysElapsed <= 10) {
    return {
      id: 'GUIDANCE_ACCELERATED_ESCALATION',
      text: "Your dispute is on Day 9 of the inquiry stage — inside the Accelerated Response window.",
      rationale: "Under PayPal Accelerated Response rules, escalating with a message sent grants 3 days for document submission before adjudication.",
      isGuidanceOnly: true,
      options: ["Continue inquiry with seller", "Review escalation to claim"]
    };
  }

  return null; // Stop condition satisfied: case is ready for draft response
}
