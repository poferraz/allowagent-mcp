# Job’z research and feasibility

Research date: October 7, 2026. Scope: desktop research and limited local code inspection. No customer interviews, provider API transactions, or model evaluations have been performed. Recommendations below are product hypotheses, not demonstrated business outcomes.

## Decision

Proceed with a narrow sandbox prototype for independent cleaners. The central hypothesis is that handling a customer's billing question inside the payment flow reduces the owner's administrative effort and helps both parties agree on the bill.

Voice invoicing is useful but already competitive. The differentiator to test is the complete cycle: understand the job, explain a specific charge, resolve an objection with owner approval, and collect the agreed amount. Do not pitch Job’z as the first AI invoicing app or claim that it prevents disputes.

The user can contribute 5–8 hours per week. Target roughly 30 hours of focused, agent-assisted work through November 11, with contingency up to 40 hours. Keep a smaller 25-hour route viable. Production payment-platform onboarding is a later project.

## What already exists

| Product / source | Verified offering | Implication for Job’z |
| --- | --- | --- |
| [Jobber AI](https://help.getjobber.com/en/articles/jobber-ai-voice-and-chat-beta/) | Voice workflows include creating quotes and invoices, sending invoices, collecting payment, and job notes. | Speaking a bill is not sufficient differentiation. |
| [Jobber client hub](https://www.getjobber.com/features/client-hub/) | Customers can review work, request quote changes, and make payments. | A customer portal itself is also established. |
| [Housecall Pro Mobile Voice Agent](https://help.housecallpro.com/en/articles/15923933-mobile-voice-agent-in-alpha) | An alpha mobile voice interface can look up business information and help perform field-service tasks. | Incumbents are moving toward conversational operations; availability and plan access vary. |
| [Fini](https://fini.ai/) | Advertises ecommerce support actions, including returns and refunds with configurable approvals. | AI resolving a payment complaint is not categorically new. Focus on small service jobs and shared review. |
| [PayPal Agent Toolkit](https://developer.paypal.com/community/blog/paypal-agentic-ai-toolkit/) | Offers agent integrations for commerce operations including invoices and payments. | Using a toolkit is implementation plumbing, not the product advantage. |

These are vendor descriptions, not independent product tests. This comparison does not establish market share or prove an unoccupied niche. Job’z is a working name; its proximity to Jobber makes a separate naming check sensible before commercial launch.

## Audience and hypothesis

Start with an independent cleaner who already uses texts or voice notes to coordinate work and prices. Their customer should not need to install an app. The owner should finish a billing task with a short description, a review, and a shared link.

Likely useful questions include: “Was the oven included?”, “Why was this visit longer?”, and “I asked you to skip that room.” These are hypotheses to test. Plumbing introduces parts, call-out charges, changing diagnoses, and more complex estimates; defer it until the workflow is validated.

Validate with three cleaners and two customers. Ask for their last actual billing misunderstanding, its resolution, time spent, and current tools. Avoid leading with “Would you use AI?” Show the two-button bill after discussing their experience. Ask them to explain what each button does, then complete one realistic task.

Decision rules, proposed rather than statistical proof:

- Continue if at least two cleaners describe a recurring problem this flow could address and two can complete the prototype with little coaching.
- Reconsider positioning if payment timing is the dominant problem and bill questions are rare.
- Stop describing the feature as a resolution assistant if people perceive it as pressuring customers or automatically discounting work.
- Test willingness to pay only after showing value. A small monthly software fee is a hypothesis; do not add platform transaction fees to the MVP.

## PayPal: technically feasible, with a deliberate boundary

### Recommended: Job’z bills plus Standard Checkout

Job’z owns the bill, its revisions, customer questions, and approvals. PayPal creates and captures the payment when the customer chooses to pay. Standard Checkout supports this client/server integration. [Checkout integration](https://developer.paypal.com/studio/checkout/standard/integrate)

The application server derives the amount from the current approved revision. A customer cannot submit a cheaper amount in a browser request. A revision change invalidates old local payment attempts before capture. This is our proposed architecture, not a PayPal feature called “revision locking.”

Call the document a Job’z invoice or bill. It is not a PayPal Invoicing API invoice. A checkout receipt is not automatically a jurisdiction-compliant tax invoice. Use fictional, explicitly zero-tax demo fixtures; live tax and invoice requirements need a separate launch review.

### Alternative: PayPal Invoicing API

It supports creating, sending, updating, and cancelling invoices. Updates replace the complete invoice object; notifications and invoice state require care. [Invoice reference](https://developer.paypal.com/invoicing/reference/), [update endpoint](https://developer.paypal.com/api/invoicing/v2/invoices-update/)

This is attractive if PayPal-hosted invoices and email become the priority. It also creates another payable surface that Job’z must keep synchronized when an issue is raised. With limited build time, choose one payment path. Do not implement both invoicing and checkout.

### Single merchant first

A sandbox business account can represent the fictional cleaning company. A buyer sandbox account pays it. No application fee, pooled balance, payout routing, or real merchant onboarding is required for this demonstration.

A commercial SaaS collecting for many independent businesses needs a separately validated onboarding architecture. PayPal’s Complete Payments Platform requires partner approval for live platform calls, although sandbox testing is possible before approval. [Platform getting started](https://developer.paypal.com/platforms/get-started)

Do not request each cleaner's PayPal password or turn a one-merchant demo into a claim of production marketplace readiness.

### Payment reliability

Provider idempotency is endpoint-dependent. The Orders create reference documents a six-hour default retention period. Keep durable application-level attempt records and never blindly restart an uncertain payment with a new identifier. [Create-order reference](https://developer.paypal.com/sdk/orders/v2/orders-create/)

For the baseline build, use server-side capture results and authenticated order/capture reconciliation on status checks and restarts. Hosted webhooks are a later resilience improvement. If enabled, verify signatures and deduplicate events; a pending capture is not a completed payment. [Webhook integration](https://developer.paypal.com/api/rest/webhooks/rest/), [payment events](https://developer.paypal.com/payment-methods/webhooks/)

Formal PayPal dispute handling and post-payment refunds are excluded from the core build. “Work it out” is a pre-payment conversation, not arbitration, escrow, debt collection, or a replacement for PayPal's dispute process.

## AI implementation and limits

Use one provider initially. Groq is a practical candidate because the existing project already has transcription experience with it:

- Whisper Large v3 Turbo for uploaded or recorded speech. Supported audio includes WEBM and M4A; the free-tier file limit is 25 MB. Our app will impose a smaller 10 MB, 90-second limit. [Speech documentation](https://console.groq.com/docs/speech-to-text)
- GPT-OSS 120B through Groq for structured extraction and issue analysis. Strict structured output is supported; schema compliance does not establish factual accuracy. [Structured outputs](https://console.groq.com/docs/structured-outputs?form=MG0AV3)

Neither provider integration has been tested for Job’z. The plan includes a short evaluation before committing to a model. Read only the current job, its selected customer, rates, relevant notes, and the customer's issue. No vector database, agents negotiating with other agents, or cross-app personal memory is needed.

The model proposes line references and explanations. Application code computes totals and checks permissions. It must not invent hours, decide who is truthful, independently grant a discount, mark a bill paid, or receive a payment-execution tool.

If a note is ambiguous, return a question. If the AI is unavailable, preserve a manual bill editor and a customer-message/owner-decision path.

## Cost and effort

Observed Groq list prices: Whisper Turbo $0.04/audio hour; GPT-OSS 120B $0.15/million input and $0.60/million output tokens. A hypothetical job using one audio minute, 10,000 input tokens and 2,000 output tokens costs approximately US$0.0034 before retries and additional turns. This is arithmetic from list prices, not a benchmark or guaranteed bill. [Audio pricing](https://console.groq.com/docs/model/whisper-large-v3-turbo), [text pricing](https://console.groq.com/docs/model/openai/gpt-oss-120b)

Use a US$25 development allowance for AI, with request limits and usage reporting. This is a proposed budget, not spending authorization. Payment sandbox uses test funds.

Local Docker plus SQLite is the baseline. If hosted on Render, a persistent disk requires a paid service; its default filesystem is ephemeral. Keep a single app instance with SQLite, or deliberately migrate to managed Postgres later. [Persistent disks](https://render.com/docs/disks)

Allow US$25/month for hosting as a planning envelope, not a verified quote. The pricing page did not expose a usable current tariff in the fetched text. Confirm the actual service and disk price before purchasing. Maintain judge access for the required period; do not depend on a short free trial.

## Reuse: small pieces, not a fork

Read-only inspection of insta-loop at HEAD 84e48f1 found:

| Local source | Finding | Recommendation |
| --- | --- | --- |
| instaloop/transcribe.py | Groq audio calls, ffmpeg conversion, long-media chunking, configuration coupling. | Adapt the provider-call pattern for short audio; omit video downloading, chunking, and MLX. |
| instaloop/brain_actions.py | Proposed actions, observed-state snapshots, approval transitions, deduplication. | Reuse the pattern; write a small billing-specific state machine. Money operations cannot use generic undo. |
| instaloop/providers/base.py | Loose dictionaries and permissive JSON repair. | Do not reuse parsing for monetary decisions; use strict schemas and validation. |
| LICENSE | MIT, copyright 2026 Poferraz. | Preserve attribution if code is copied; record exact files and commits in a reuse manifest. |

The source checkout had an untracked .hermes directory; it was not read or changed. The existing application is desktop-only and single-user, so transplanting its UI and database would introduce unnecessary work. The checklist project's local PIN is not suitable authentication for Job’z. No code has been copied.

## Remaining evidence needed

1. CAD sandbox create/approve/capture and uncertain-response reconciliation.
2. Realistic extraction quality on amounts, negation, and missing rates.
3. Customers understand “Work it out” and owners accept its approval flow.
4. A measured end-to-end demo completes with manageable latency.
5. Exact submission-form fields and entrant eligibility. The connector failed; the public event pages were reviewed, but account-specific submission fields remain unverified.

The accompanying design and plan make these uncertainties early acceptance gates rather than assuming them away.
