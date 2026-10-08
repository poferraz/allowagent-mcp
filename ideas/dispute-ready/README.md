# CaseReady — customer dispute companion

October 7, 2026. Exploratory concept for the PayPal AI Hackathon. This is a product direction, not an implementation specification.

Deep-dive prompt: [prompts/deep-dive.md](prompts/deep-dive.md)
Deep-dive deliverable (research-verified, 2026-10-08): [deep-dive.md](deep-dive.md)

## Design brief

Create a human, empathetic guide that removes the burden of handling a difficult payment dispute. It should know what PayPal needs, ask only the necessary questions, explain the next step plainly, and keep the customer in control.

## The problem

When a purchase goes wrong, a customer must decide whether the problem qualifies for a dispute, choose the right reason, find the right records, describe what happened, and meet PayPal's response deadlines. The facts are usually scattered across an order confirmation, merchant messages, tracking, photos, a return receipt, and the PayPal transaction.

The stressful part is not pressing “open a dispute.” It is knowing what to do next and whether the evidence actually supports the claim.

## Product promise

**CaseReady turns a confusing payment problem into a verified, evidence-backed next step.**

It does not promise that a dispute will win. It tells the customer:

- what PayPal case stage they are in;
- what reason appears to fit the facts;
- what evidence PayPal is asking for;
- what is missing, contradictory, or unsupported;
- what deadline matters;
- what factual response can be submitted after the customer reviews it.

## Customer flow

1. The customer connects a PayPal account or opens an existing dispute.
2. CaseReady retrieves the transaction, dispute reason, lifecycle stage, requested evidence, allowed actions, and due date.
3. The customer adds records: receipt, merchant messages, photos, tracking, return proof, or refund confirmation.
4. AI extracts facts and links each claim to a source record.
5. The app shows a readiness checklist, for example:
   - “You selected item not received.”
   - “Tracking information is missing.”
   - “The merchant promised a refund, but no refund ID is present.”
   - “Your response is due on [date].”
6. The customer edits the factual summary and approves the response.
7. The app submits the supported evidence action and listens for the dispute webhook.

## Why this is meaningful AI

Rules can list fields. AI is useful because the evidence arrives as unstructured, conflicting material:

- a seller says “delivered” while the tracking screenshot says “label created”;
- a refund is promised in chat but the transaction has no refund ID;
- the customer selects “not as described” but the product description supports the seller;
- a return label exists but there is no proof that the package was accepted.

The model extracts, compares, cites, and asks for the missing fact. It never invents evidence or decides the outcome.

## PayPal integration

The Disputes API can retrieve dispute details, including reason, status, lifecycle stage, requested evidence, allowed response options, and response deadline. It supports evidence submission, supporting information, messages, escalation, and buyer actions during the appropriate lifecycle stages. PayPal's evidence guidance maps reasons such as item not received, not as described, unauthorized, duplicate, incorrect amount, and canceled recurring billing to evidence types. See the [Disputes API guide](https://developer.paypal.com/platforms/disputes/handle-disputes/use-disputes-api/), [reasons and evidence](https://developer.paypal.com/disputes/reasons-evidence/), and [lifecycle reference](https://developer.paypal.com/disputes/disputes-lifecycle/).

## Feasible hackathon MVP

Use one sandbox buyer account and one dispute type: **MERCHANDISE_OR_SERVICE_NOT_RECEIVED** or **MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED**.

Build only:

- sandbox transaction and dispute fixture;
- dispute details screen;
- document and message upload;
- evidence extraction with source citations;
- missing-evidence and contradiction checklist;
- factual response draft;
- explicit approval before provide-evidence;
- webhook status update;
- a clear “not enough evidence” outcome.

The sandbox supports buyer-side dispute creation for testing. PayPal documents that the create-dispute endpoint is sandbox-only, so the live product should be framed as an assistant for an existing case or Resolution Center handoff until live buyer permissions and entry points are verified.

## Recommended sponsor stack

- **PayPal Disputes API:** case details, evidence, supported actions.
- **PayPal Webhooks:** created, updated, and resolved events.
- **PayPal AI Toolkit or Agent Toolkit:** PayPal-aware agent actions.
- **Elastic:** retrieve and compare messy evidence.
- **AG Grid:** show a case timeline and evidence matrix.
- **Render Workflows:** process uploads and deadline reminders.
- **APIMatic/Postman:** keep the integration accurate while building.

Do not add Zapier, KERNEL, Channel3, Bryntum, or Astropods unless the demo has a real need for them. The dispute workflow is already enough.

## Three-minute demo

1. A customer opens a dispute for a missing package.
2. CaseReady reads the case and says: “Your response is due Friday. PayPal requests proof of fulfillment or a refund reference.”
3. The customer uploads an order confirmation, merchant chat, and tracking screenshot.
4. AI identifies that tracking shows a label was created but no delivery scan exists.
5. The app drafts a factual response with highlighted sources and marks the missing proof.
6. The customer approves the evidence submission.
7. A webhook changes the case status and the app explains the next step.

## Success measures

- Time from “I have a problem” to “I know my next step.”
- Percentage of required evidence fields correctly identified.
- Number of unsupported claims caught before submission.
- Customer understanding of the deadline and case stage.
- No fabricated evidence and no promise of a favorable outcome.

## Naming directions

- CaseReady
- ClaimKit
- ResolvePath
- PayProof

CaseReady is the current working name because it describes readiness rather than promising a win.
