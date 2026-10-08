# CaseReady deep-dive prompt

Copy the prompt below into a research-capable model or agent.

## Prompt

You are a product strategist, service designer, and compassionate UX researcher. Deep-dive the concept **CaseReady**, a customer-first PayPal dispute companion.

The goal is to help a stressed customer handle a difficult payment problem with the least possible effort. CaseReady should feel human, calm, empathetic, direct, and useful. It should understand what PayPal needs, ask only the questions that matter, explain why it is asking, identify missing or contradictory evidence, and guide the customer to the next correct action.

The product must not promise that a dispute will succeed, provide legal advice, invent evidence, exaggerate a claim, or submit a consequential action without the customer's approval. Separate verified PayPal facts, customer statements, extracted evidence, assumptions, and unresolved questions.

Research current official PayPal documentation before making technical claims. Verify:

- buyer versus merchant dispute capabilities;
- sandbox versus live limitations;
- account consent, scopes, and authentication;
- dispute reasons and evidence types;
- lifecycle stages, deadlines, and available actions;
- evidence file types and size limits;
- dispute webhooks and status changes;
- the smallest credible hackathon implementation.

Do not begin with a generic feature list. Begin with the customer's emotional and practical journey:

1. What has happened to the customer?
2. What are they afraid of getting wrong?
3. What information can CaseReady obtain automatically?
4. What is the smallest number of questions needed to understand the case?
5. What evidence does PayPal require for that specific reason?
6. What can the customer do now?
7. What happens next and when?

Explore these sections:

### 1. Problem definition

Identify the specific everyday payment situations CaseReady should solve first. Compare item not received, not as described, duplicate charge, incorrect amount, canceled recurring billing, refund not processed, and unauthorized payment. Recommend one primary scenario for the MVP and explain why.

### 2. Human experience

Design the companion's tone, language, pacing, and moments of reassurance. Define how it handles anger, confusion, embarrassment, missing records, contradictory evidence, low confidence, and a customer who wants to give up. Keep every message short and concrete.

### 3. Question strategy

Create an adaptive question tree. The assistant should ask one question at a time, skip anything already answered by PayPal data or uploaded evidence, explain why each question matters, and stop asking once it has enough information. Show the exact wording of the questions.

### 4. Evidence intelligence

Define how the AI should classify receipts, messages, tracking, screenshots, photos, refund confirmations, policies, and contracts. For every extracted fact, show how the customer can inspect its source. Identify contradictions and missing evidence without accusing either party.

### 5. Product flow

Describe the end-to-end flow from opening an existing case to submitting evidence and receiving a status update. Include the exact screens or conversation states, the approval moments, the deadline treatment, and the fallback when the API cannot perform an action.

### 6. PayPal integration

Map each step to the PayPal API, webhooks, or Resolution Center. Clearly label what can work in the sandbox, what requires buyer consent, what may be merchant-only, and what is not yet verified. Cite official documentation links near every technical claim.

### 7. AI behavior contract

Write explicit rules for what the AI may do, must show, must ask, and must refuse. Include confidence handling, source citations, refusal to fabricate, no outcome guarantees, idempotency, and human approval before evidence submission.

### 8. MVP and demo

Design a small, believable hackathon MVP for one person working 5–8 hours per week. Use one dispute reason, one sandbox buyer account, a small set of fictional evidence files, one evidence submission, and one webhook update. Specify the three-minute demo story.

### 9. Privacy and trust

List the minimum data collected, retention choices, redaction needs, account security concerns, and the trust language the customer should see. Keep this practical and tied to the MVP.

### 10. Evaluation

Define measurable success criteria:

- time to understand the next step;
- number of questions asked;
- evidence completeness;
- unsupported claims caught;
- customer comprehension of the deadline;
- factual accuracy;
- successful sandbox submission;
- absence of invented evidence or false certainty.

Return the result in this order:

1. One-sentence product promise.
2. Recommended primary customer scenario.
3. Why AI is necessary.
4. Customer journey table: moment, customer feeling, assistant behavior, PayPal action.
5. Adaptive question tree with exact wording.
6. Evidence checklist and contradiction examples.
7. PayPal feasibility table with official links.
8. MVP scope and three-minute demo.
9. What CaseReady must never do.
10. Main risks and unresolved feasibility questions.
11. Three decisions the founder must make next.

Be direct. Prefer a few precise recommendations over a broad list of features. Do not use “AI-powered” as an explanation by itself.
