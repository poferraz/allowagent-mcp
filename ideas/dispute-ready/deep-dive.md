# CaseReady deep-dive — customer-first PayPal dispute companion

October 8, 2026. Research-backed product deep-dive for the PayPal AI Hackathon. Grounded in official PayPal documentation (fetched 2026-10-08); every technical claim carries a bracketed citation resolved in the Sources block. Facts that no source could verify are marked `[unverified]`.

---

## 1. One-sentence product promise

**CaseReady turns a stressful PayPal dispute into a calm, evidence-backed next step: it reads your case, asks only the questions whose answers change what you should do, shows exactly what PayPal is asking for, and never submits anything until you approve it.**

---

## 2. Primary MVP scenario

**Item Not Received (INR)** — `MERCHANDISE_OR_SERVICE_NOT_RECEIVED`.

Why this scenario over the alternatives:

- **It is the best-documented and most tractable scenario.** INR is the canonical dispute PayPal's own docs use for lifecycle, webhook, and evidence testing — the sandbox has complete buyer-side test recipes for it (create transaction → create dispute → provide evidence → settle → webhooks at each step).[8]
- **The evidence question has a crisp answer.** For INR, PayPal requests `PROOF_OF_FULFILLMENT` (carrier + tracking) or `PROOF_OF_REFUND` (refund ID) from the merchant's side, and the buyer's story is mostly a factual timeline: ordered, promised by, tracking shows X, merchant said Y.[5]
- **It starts in the inquiry stage.** INR (and SNAD) disputes begin in `INQUIRY`, where direct buyer↔merchant messaging, offers, and escalation exist — the richest stage for guidance, and the one where a buyer can act without waiting on PayPal.[3][4]
- **The deadline structure is simple.** The buyer has 180 days from payment to open; the inquiry window is 20 days; escalation to a claim hands adjudication to PayPal within 10 days.[3][11]

**Rejected scenarios:** unauthorized transaction (handled as a direct claim, buyer faces account-security questions that need human support, and the buyer and merchant receive *different* dispute IDs — extra complexity[8]); SNAD (evidence is more subjective — photos, descriptions, third-party opinions[5]); duplicate/incorrect-amount/recurring-billing (lower emotional stakes, less demo-narrative value); refund-not-processed (CREDIT_NOT_PROCESSED evidence is mostly a refund ID, little AI work).

**The primary persona:** a customer who already opened (or is about to open) an INR dispute in the Resolution Center, is confused about what "respond" means, and has records scattered across order email, merchant chat, and a tracking screenshot. In the sandbox, CaseReady plays this out with buyer-side credentials (see §7).

---

## 3. Why AI is necessary

Rules can map reason → evidence type. AI is needed because the customer's materials are **unstructured, scattered, and contradictory**:

- The tracking screenshot says "label created" but the merchant's email says "delivered" — a contradiction the customer may not notice, and which changes whether INR even survives.
- The refund is promised in chat but the transaction has no refund ID — supporting the INR claim vs. an already-resolving situation are different next steps.
- The customer describes "I never got it" but the timeline shows a neighbor signed for the package — an honest description still needs the *right* framing, not a better adverb.
- An order confirmation buried in email contains the merchant name, amount, date, and expected-delivery text; extracting those fields and citing the exact line is AI work, not form-filling.

The alternative product without AI is a static checklist page — it cannot read a tracking screenshot, cannot notice that the customer's selected reason contradicts their own evidence, and cannot draft a factual timeline. The alternative with AI but without PayPal state is a generic "write my complaint letter" bot — it cannot tell the customer that the case is `WAITING_FOR_BUYER_RESPONSE` with a due date, or that escalation on day 8+ with a message sent gives only 3 days for documents.[9]

CaseReady's AI therefore does four things rules can't: **classify records, extract facts with source citations, detect contradictions, and map the case state to the one correct next action** — while every consequential step stays behind explicit human approval.

---

## 4. Customer journey table

| # | Moment | Customer feeling | Assistant behavior (calm, short, concrete) | PayPal action / state |
|---|---|---|---|---:|
| 1 | Lands after clicking "open a dispute" or from a case email | Anxious, wants to know if this is winnable | "You're in the right place. Let's look at what PayPal knows about your case first — no forms yet." | `GET /disputes` → find case[2] |
| 2 | Sees case status in plain language | Disoriented by jargon | "Your case is in the **conversation stage** (inquiry). That means you and the seller talk first. PayPal isn't judging yet." | stage `INQUIRY`, status `OPEN`[4] |
| 3 | Learns the deadline | Terrified of missing it | "Nothing is due from you right now. The conversation window closes **Nov 20** (20 days from opening). I'll remind you before anything is due." | `buyer_response_due_date` / `seller_response_due_date`[2] |
| 4 | Asked for records | Overwhelmed by scattered files | "Do you have the order confirmation email? It usually has the merchant name and promised date. Tap to upload — I read it and show you what I found." | upload (local, not PayPal)[6] |
| 5 | Sees extracted facts with sources | Skeptical ("did it read that right?") | Show each fact as: *claim — source — excerpt*. "The merchant's Nov 1 email says 'shipped Oct 30'. Tracking shows the label was created Nov 2. Here's the screenshot." | extraction, cited |
| 6 | Learns of contradiction | Embarrassed, defensive | "One thing doesn't line up, and it's normal: the merchant says delivered, tracking shows no delivery scan. This doesn't hurt your case — it's actually what PayPal asks about." | contradiction flag |
| 7 | Sees evidence checklist | Relief ("I know what's needed") | "PayPal's case asks the **seller** for tracking or refund proof — that's already marked. What helps you now: your tracking screenshot showing no delivery scan, and the chat where the merchant stopped replying." | `evidences[].evidence_type` requested from each party[2][5] |
| 8 | Reads the drafted response | Cautious about what's being sent | Show the draft response with highlighted sources. "Everything in this draft comes from your files. Edit anything. Nothing sends until you press Submit." | draft state |
| 9 | Approves | Empowered | "Sent. I'll watch for the seller's reply and nudge you if PayPal asks for anything else." | `POST /provide-supporting-info` (see §7) |
| 10 | Status changes | Wanting closure | "The seller offered a full refund through the dispute. You can accept it in the Resolution Center — when you do, PayPal refunds automatically." | offer → `accept-offer`[2] |

**Moments of reassurance** are built at steps 2, 3, 6, 9: stage meaning, deadline safety, normalization of contradictions, and control at the approval gate. Anger is handled by never arguing and offering the escalation path with its honest tradeoffs (below). A customer who wants to give up is shown the smallest single next action, not the whole process.

---

## 5. Adaptive question tree (exact wording)

Principles: one question at a time; every question says why it matters; skip anything PayPal data or an upload already answered; stop as soon as the next action is determined. Q1 is asked only if no dispute exists yet (pre-filing triage); if a case exists, the tree starts at Q3 with fields auto-filled from `GET /disputes/{id}`.[2]

```
START (case connected)
│
├─ If no dispute exists yet:
│   Q1. "What's the main problem — something you paid for never
│        arrived, arrived different than described, a charge you
│        don't recognize, or something else?"
│        (Why: the reason decides both the deadline and what evidence
│         PayPal needs — picking the wrong one is the #1 mistake.)
│   ├─ never arrived → INR branch (MVP)
│   ├─ different than described → SNAD: note the 30-day-from-delivery
│   │    window [11]; out of MVP scope, hand to checklist mode
│   ├─ don't recognize → "This one is different: unauthorized
│   │    transactions go straight to PayPal, not the seller chat.
│   │    Here's what to do right now, and you should change your
│   │    password immediately." (guidance-only path)
│   └─ something else → map to reason enum [2]; if no fit, guidance-only
│
├─ Q2 (INR branch). "When did you pay, and have you already contacted
│    the seller about it?"
│    (Why: PayPal requires trying the seller first before filing a
│     claim [11], and the 180-day window runs from the payment date.)
│   ├─ paid >180 days ago → "I'm sorry — this window has closed for a
│   │    PayPal dispute. Here's what you can still do." (stop asking)
│   └─ within window, seller contacted → continue
│
├─ Q3. "Do you have any of these? Order confirmation, messages with
│    the seller, a tracking page or screenshot, or a refund
│    confirmation?"  (multi-select, with why: "each one fills a
│    different gap in your timeline.")
│   └─ For each selected → upload → extract → show facts + sources
│
├─ Q4 (asked only if tracking not already extracted). "Does the
│    tracking number you have show a delivery scan — or does it stop
│    before that?"
│    (Why: the delivery scan is the fact PayPal's decision turns on.)
│   ├─ stops before delivery / no delivery scan → strong INR support
│   │    ("Good — that's the fact your case rests on. I've marked it
│   │    as the key evidence, with the screenshot as its source.")
│   └─ shows delivered → contradiction handling: "Tracking says
│        delivered — let's check what the merchant has before we
│        respond. Did it arrive at your address, a neighbor, or
│        somewhere else?" → honest assessment: INR likely fails;
│        offer the accurate alternative (SNAD / misdelivery facts).
│
├─ Q5 (asked only if merchant chat uploaded). "The seller mentioned a
│    refund in your conversation. Did money actually come back to
│    you?"  (Why: a promised-but-missing refund changes the case from
│    INR toward CREDIT_NOT_PROCESSED and changes what PayPal asks.)
│   └─ answers feed the timeline; contradictions surface here
│
└─ STOP when: reason mapped + deadline known + key records extracted
     + contradictions resolved or flagged.
     Then: checklist + draft response + single next action.
```

**Hard stop conditions** (the assistant stops asking and switches to guidance): payment >180 days ago; dispute already `RESOLVED` or `UNDER_PAYPAL_REVIEW` (no buyer actions available[4]); customer wants to give up (show one smallest step); unauthorized-transaction branch (guidance-only, per legal safety).

**Question budget:** the tree is tuned to finish in **4–6 questions** for a typical INR case with a tracking screenshot — everything else comes from extraction, not interrogation. The tree is adaptive: every question is asked only if the prior answer (or an extracted fact) leaves the next action genuinely undetermined.

---

## 6. Evidence intelligence

### 6.1 Record classification (what the AI maps uploads to)

| Record | Classified as | Feeds |
|---|---|---|
| Order confirmation / receipt | `PROOF_OF_RECEIPT_COPY` analog; order facts | timeline, amount, merchant, promised date |
| Merchant chat / email | communication evidence | contact-first requirement [11], promised refund, seller's delivery claim |
| Tracking page / screenshot | tracking fact | the delivery-scan question (Q4) |
| Photos of package/condition | SNAD analog | out of MVP; acknowledged, not scored |
| Refund confirmation | `PROOF_OF_REFUND` analog | reason re-mapping (Q5) |
| Return receipt | return proof | out of MVP (SNAD return flows) |

### 6.2 Evidence checklist for the MVP INR case

PayPal's case shows an `evidences[]` array whose entries name the evidence type and which party it's requested from (`source`: `REQUESTED_FROM_SELLER`, `REQUESTED_FROM_BUYER`, or submitted entries with `SUBMITTED_BY_*`)[2]. The checklist is generated from **the case's own `evidences[]` + the official reason→evidence map**[5], never from a generic list:

| Checklist item | Status from | Buyer's role |
|---|---|---|
| Seller: carrier + tracking (`PROOF_OF_FULFILLMENT`) | case `evidences[]` | wait / verify against own records |
| Seller: refund ID (`PROOF_OF_REFUND`) | case `evidences[]` | wait / verify |
| Buyer: story consistency + timeline | extraction | answer 4–6 questions, correct facts |
| Buyer: tracking screenshot (no delivery scan) | upload | upload once; AI cites the exact line |
| Buyer: merchant-contact proof | chat upload | auto-satisfied by extraction |

### 6.3 Contradiction examples and handling

- **"Delivered" vs. label-only tracking** → neutral framing: "The seller's message and the tracking disagree. PayPal will look at both. Your screenshot is the stronger record." Never: "the seller is lying."
- **Promised refund vs. no refund ID** → "A refund was promised in chat but hasn't arrived. That's common — and it's why your case stays open. We'll state exactly what was promised and when."
- **Reason mismatch (customer picked INR, tracking shows delivered)** → surface it honestly before any draft is built: "This changes what PayPal will decide. Here are the options with what each means."
- **Missing records** → "No tracking number at all? That's okay — here's the message to send the seller to ask for it" (drafted, shown for copy, never auto-sent).

Every extracted fact renders as **fact — source record — quoted excerpt**, and the customer can correct any fact. The AI never upgrades a customer's statement into a fact: customer statements are labeled *statement*, extraction outputs are labeled *evidence*, verified PayPal case fields are labeled *case fact* — the three-tier labeling from the brief is enforced in the data model, not just the prose.

---

## 7. PayPal feasibility map

| Product capability | API / mechanism | Buyer-side? | Sandbox | Live | Notes |
|---|---|---:|---:|---:|---|
| Read your disputes | `GET /v1/customer/disputes`, `GET /{id}` | ✅ scope `disputes/read-buyer` | ✅ | ✅ | Field visibility differs by party (buyer view omits some fields vs. merchant view).[2] |
| Create a dispute | `POST /v1/customer/disputes` + `PayPal-Auth-Assertion` JWT | ✅ but **sandbox-only** | ✅ | ❌ | Sandbox-only endpoint; buyer consent via Log in with PayPal + scopes `disputes/create`, `disputes/update-buyer` added by PayPal account manager.[7][8] |
| Change dispute reason | `POST /{id}/change-reason` | ✅ but sandbox-only | ✅ | ❌ | Buyer-side credential flow required; live entry point is the Resolution Center "Change case type".[7][8] |
| Send message to seller | `POST /{id}/send-message` | ✅ scope `disputes/update-buyer` | ✅ | ✅ | Only in `INQUIRY` stage; can attach files (multipart, ≤10MB/file, ≤50MB/call, jpg/jpeg/gif/png/pdf).[2][4][6] |
| Provide evidence | `POST /{id}/provide-evidence` | ✅ scope `disputes/update-buyer` | ✅ | ✅ | Buyer provides evidence when status is `WAITING_FOR_BUYER_RESPONSE`; up to 100 evidence items; notes ≤2000 chars.[2] |
| Provide supporting info | `POST /{id}/provide-supporting-info` | ✅ (update-buyer or update-partner) | ✅ | ✅ | For when the case's HATEOAS links expose `provide-supporting-info` (e.g. UNDER_REVIEW); file upload supported.[2][9] |
| Accept/deny seller's offer | `accept-offer` / `deny-offer` | ✅ scope `disputes/update-buyer` | ✅ | ✅ | Buyer-only endpoints; accepting auto-refunds the offered amount.[2] |
| Escalate inquiry → claim | `POST /{id}/escalate` | ✅ scope `disputes/update-buyer` | ✅ | ✅ | Only in `INQUIRY` stage; PayPal docs for buyers list escalate as a buyer action; note that notes become PayPal-agent-visible only after claim stage.[2][4][9] |
| Receive status changes | Webhooks `CUSTOMER.DISPUTE.CREATED` / `.UPDATED` / `.RESOLVED` | platform-level | ✅ | ✅ | Webhook subscription is app-level; payload carries `dispute_id` etc. Sandbox test recipes exist for each trigger.[8][10] |
| Settle / simulate outcome | `adjudicate`, `require-evidence` | test tools | ✅ | ❌ | Sandbox-only by design — used in the demo to walk the case to resolution.[2][8] |
| Escalated-timing rules (Accelerated Response) | documented behavior | informational | ✅ | phase roll-out | Escalating day 8–10 with a message sent → 3 days for documents; after day 10 → case closes in buyer's favor; seller escalation after day 8 → 3 days.[9] |

The table maps each capability to the official Disputes v1 API reference and its authoritative OpenAPI schema.[1][2] Field visibility and allowed actions come from the case's own response (HATEOAS links, `status`, `allowed_response_options`), not from assumptions.[2]

**Consent & auth model:** merchant apps use OAuth2 client-credentials with dispute scopes; buyer actions additionally need a **Log in with PayPal consent** (sandbox: user logs in with the personal account and approves) plus the `PayPal-Auth-Assertion` JWT header carrying the buyer identity on every buyer-acting call.[7] Scopes `disputes/create` and `disputes/update-buyer` are added by contacting a PayPal account manager.[7]

**What is NOT verified:** whether PayPal would grant `disputes/create`/`update-buyer` scopes to a live consumer app (docs frame them in the sandbox/test-simulation context[7]); whether live buyers can act via API without merchant sponsorship `[unverified]`; document download scope is limited-release (account-manager gated[7]) — so the MVP never claims to retrieve files, only to read case fields and upload.

**MVP integration choice:** CaseReady's demo persona is the buyer; the app holds merchant-type sandbox credentials for read operations (list/show work with read scopes for either party[2]) and acts for the buyer via `PayPal-Auth-Assertion`. This matches PayPal's own sandbox test recipes exactly, where a merchant "handles" the dispute a buyer creates.[7][8]

---

## 8. MVP scope and three-minute demo

**Builder budget: one person, 5–8 h/week. Weeks 1–6.** Stack: React/Vite/TS/Tailwind frontend, thin Node/Express server (token + `PayPal-Auth-Assertion` handling + webhook receiver), no database in MVP (case JSON cached in memory/localStorage), Render free tier for hosting + webhook endpoint. No Elastic, no AG Grid, no Zapier in v1 — the demo is a conversation, not a dashboard. Elastic may be added in week 7+ only if extraction quality demands it.

**Scope (in, one reason only: INR):**
1. Sandbox setup: personal + business sandbox accounts, REST app with customer-disputes enabled, buyer-side credentials + auth-assertion JWT generation.[7]
2. Seed script: create transaction ($20 sandbox payment) → create INR dispute as buyer via `POST /v1/customer/disputes` with auth-assertion (sandbox-only)[8] → optionally `require-evidence` to move status to `WAITING_FOR_BUYER_RESPONSE` for the provide-evidence beat.[8]
3. Case screen: dispute reason, stage, status, due dates, allowed actions — plain-language panel driven by `GET /disputes/{id}`.
4. Upload + extraction: 3 fictional files (order email, merchant chat, tracking screenshot) → AI extracts facts with per-fact source citations.
5. Readiness checklist from the case's `evidences[]` + official reason→evidence map; contradiction panel.
6. Draft response assembled from extracted facts; customer edits; explicit approve button; then `provide-supporting-info` or `provide-evidence` (buyer side, status permitting).
7. Webhook receiver on Render → status banner update → plain-language "what happens next."
8. Honest empty state: if the checklist can't be satisfied, say so: "Not enough evidence yet — here's the smallest next step."

**Demo story (3 minutes, single INR case):**
- 0:00–0:20 — "Maya paid for a desk that never arrived. She opened a dispute and has no idea what 'respond' means. This is CaseReady."
- 0:20–0:50 — Connect: case loads. "Conversation stage. Nothing is due from you until Nov 20. Right now PayPal is asking the **seller** for tracking or refund proof — you're not on the clock."
- 0:50–1:40 — Maya uploads the three files. Extraction runs: facts appear with sources. Contradiction surfaces: seller said "delivered", tracking shows no delivery scan. Checklist: seller items requested; buyer item (tracking screenshot) marked ready.
- 1:40–2:20 — Draft response builds from her facts, highlights sources. She edits one line, presses **Review & approve**, confirms. Call goes to `provide-supporting-info`; status flips to under-review; webhook `CUSTOMER.DISPUTE.UPDATED` arrives → banner explains it.
- 2:20–3:00 — Settle in sandbox (buyer favor) → `CUSTOMER.DISPUTE.RESOLVED` webhook → "Case closed. Money is being returned. Here's what the decision said and what happens next." Close on the principle: *the customer never has to figure out what to ask, what to upload, or what happens next.*

---

## 9. What CaseReady must never do

1. **Never promise or imply a win.** No "we'll get your money back", no odds, no percent chances. The promise is a *verified next step*, not an outcome.
2. **Never fabricate or embellish evidence.** Every fact in a draft must trace to a customer upload or a PayPal case field; unverifiable statements stay labeled *statement*. If extraction confidence is low, show the doubt, don't smooth it.
3. **Never exaggerate the claim.** "Tracking shows no delivery scan" — not "the seller is lying" or "package was stolen." Neutral contradiction language only.
4. **Never submit without explicit approval.** All write actions (`send-message`, `provide-evidence`, `provide-supporting-info`, `escalate`, `accept-offer`, `deny-offer`) render a review screen with exact payload preview; approval is a separate explicit press. No auto-submission on timers or chat intent.
5. **Never give legal advice.** "PayPal's published terms say X" with citation — never "you have a legal right", "this violates consumer law", or advice to contact a lawyer unless the customer asks about one. Escalation and appeals are presented as PayPal process options, not litigation strategy.
6. **Never invent a deadline.** Due dates come only from the case's `buyer_response_due_date`/`seller_response_due_date` fields or documented windows (180-day, 20-day, 10-day); if absent, say "PayPal hasn't set a due date on this case" instead of guessing.[2][3]
7. **Never claim capabilities that aren't verified live.** Create-dispute and change-reason are sandbox-only; the live product copy says "connect your case" not "we'll open disputes for you" until live buyer permissions are confirmed.[7][8]
8. **Never block a human path.** Every screen links the Resolution Center as the always-available alternative; CaseReady is a companion, not a gatekeeper.
9. **Never store more than needed.** No credentials, no PayPal password, no document hoarding (see §10).
10. **Never let the AI decide the outcome.** The model proposes; the customer approves; PayPal adjudicates. The AI's confidence is displayed, never acted on.

**AI behavior contract (operational):** responses are generated only from (a) case fields, (b) uploaded documents, (c) customer answers — a closed context. Any fact not in the closed context gets `[unverified]` treatment. Idempotency: submission buttons disable after press and the server dedupes by case ID + action + payload hash, so a double-tap never double-submits. Low-confidence extraction (<0.7) → ask the customer to confirm instead of asserting. The draft view is fully editable; "approve" requires a diff from the last previewed version (no approving something the model silently changed).

---

## 10. Privacy and trust

**Minimum data collected (MVP):** sandbox PayPal OAuth tokens (in memory), dispute case fields pulled via read scopes, uploaded documents, and the customer's typed answers. No real names, no passwords, no card numbers, no bank links. PayPal's own privacy statement describes collection of personal information at account open/use, and names the local PayPal entity as data controller for that data.[12] CaseReady is a separate processor for its own small data set: uploads + answers + case snapshots.

**Design rules:**
- **Process-in-place.** Documents are extracted (OCR/LLM) and then deleted; the extracted, cited facts are retained, raw files are not (retention: until case resolution, then 30 days).
- **Customer-controlled visibility.** Everything CaseReady knows is visible to the customer with its source; nothing is hidden in a profile.
- **Redaction.** The extraction step redacts anything that looks like a card number, government ID, or password from notes before they enter any draft or PayPal submission (buyers sometimes paste far too much into dispute notes).
- **Trust language (shown, not buried):** "CaseReady is an independent assistant — not PayPal. It never submits anything without your approval. Your documents are read to build your response, then deleted." Plus a plain link to PayPal's buyer-protection terms for the 180-day/30-day windows so the customer doesn't have to trust CaseReady's paraphrase.[11]
- **Account security:** no password ever entered into CaseReady; connection is OAuth consent only; a "disconnect" control deletes local data immediately.

---

## 11. Evaluation (success metrics)

| Metric | How measured | MVP target |
|---|---|---|
| Time to "I know my next step" | timestamp from case load → first next-action shown | < 90 seconds |
| Questions asked | counter per session | ≤ 6 (typical 4) |
| Evidence completeness | checklist items satisfied / items applicable | ≥ 90% for demo cases |
| Unsupported claims caught | contradictions surfaced pre-draft / contradictions in ground-truth fixture | 100% of seeded contradictions caught |
| Deadline comprehension | customer can state the due date/action owner after session (demo probe) | correct on 5/5 demo runs |
| Factual accuracy | every draft fact traces to a cited source | 100% (zero uncited facts in draft) |
| Successful sandbox submission | `provide-supporting-info`/`provide-evidence` returns 200 | 100% of demo runs |
| Absence of fabrication/false certainty | human audit of drafts on fixture set | 0 fabricated facts, 0 outcome promises |

Fixture: 3 seeded INR cases (clean, contradictory, insufficient) + 1 edge (delivered-tracking INR) to prove honest handling.

---

## 12. Main risks and unresolved feasibility questions

1. **Live buyer-access is the existential question.** Read scopes are documented (`disputes/read-buyer`) and buyer write scopes exist (`disputes/update-buyer`), but the *paths to a live consumer app getting them* are documented only in the sandbox/test context, with scope grants "contact your PayPal account manager".[7] If live buyer write-access is unavailable to an indie app, CaseReady pivots to: (a) draft-and-copy (generate the response + evidence list for manual Resolution Center paste), or (b) Resolution Center handoff. Read-only live mode may still be viable `[unverified]`.
2. **Document download is limited-release.** CaseReady can't programmatically retrieve previously submitted evidence files without a gated scope[7] — so the product never assumes it can show the seller's uploaded documents, only case fields. Buyer uploads cover the customer's own records.
3. **Webhook receiver needs public HTTPS.** Render solves it, but the webhook fires for the app's subscribed events regardless of which sandbox party acted; MVP must filter by dispute ID and verify signatures.
4. **Extraction fidelity on messy screenshots.** Tracking screenshots vary wildly; the contradiction detector must not hallucinate a delivery scan. Mitigation: extraction requires the customer to confirm the key fact (delivery scan yes/no) — human-in-the-loop on the load-bearing fact, not just the final draft.
5. **The 20-day inquiry is a product-timing constraint.** A user who arrives on day 18 gets different guidance (escalation tradeoffs: escalate after day 10 with a message sent → case closes in buyer's favor[9]) than a day-1 user; the guidance logic must encode these stage/date rules from documented behavior, not vibes. Risk: PayPal rolls out Accelerated Response in phases — the timing rules may differ per account.[9]
6. **Dispute reason is buyer-selected at filing; wrong reasons are common.** CaseReady can detect a reason/evidence mismatch but live reason changes are Resolution-Center-only (change-reason endpoint is sandbox-only[8]); the live product must *guide the change*, not perform it.
7. **LLM output is a legal-adjacent artifact.** Even with the behavior contract, a hallucinated line in a submitted note is the worst-case failure. Mitigation: drafts are assembled from extracted fact records (templates + fields), not free-generation; the model narrates, extraction fills, and every sentence in a draft has a source pointer.
8. **Hackathon fit risk.** If judges evaluate on API breadth, a single-reason buyer companion may look small. Counter: the demo's webhook loop + honest-empty-state + contradiction detection is the AI story, and the sponsor stack (Render for webhooks, Postman/APIMatic for accuracy) is used only where it shows.

---

## 13. Three decisions the founder must make next

1. **Live-mode posture:** commit to which of the three live fallbacks is the *real* product — draft-and-copy, Resolution-Center handoff, or holding out for account-manager-granted buyer scopes — because it changes the approval-gate UX and all product copy. (Recommendation: build draft-and-copy as the default; treat API-submitted evidence as the sandbox demo's differentiator.)
2. **The extraction human-in-the-loop boundary:** which facts must be customer-confirmed before entering a draft (recommendation: exactly the load-bearing ones — delivery scan, refund received, purchase date) vs. auto-extracted; this is the line between trust and friction.
3. **Scope of the contradiction engine for the demo:** ship the three seeded contradiction types (delivered-vs-tracking, promised-refund-vs-no-refund, reason-vs-evidence) or invest in the fourth (misdelivery-neighbor) for narrative depth. (Recommendation: three is enough — each maps to a distinct product beat and keeps the 5–8 h/week budget honest.)

## Sources

[1] https://developer.paypal.com/api/customer-disputes/v1 — Disputes v1 API reference (PayPal Developer)
    > "Important: This method is for sandbox use only."
[2] https://developer.paypal.com/api/customer-disputes/v1/schema.json — Disputes v1 OpenAPI 3.2 schema (authoritative contract)
    > "This privilege allows client to read and search disputes but returns a limited and allowed set of fields back."
    > "Any proof about the non receipt of the item, such as screenshot of tracking info."
    > "A merchant can provide evidence for disputes with the"
[3] https://developer.paypal.com/disputes/overview — Disputes overview (PayPal Developer)
    > "The buyer has 180 days from the payment date to dispute a transaction."
    > "The buyer and merchant have up to 20 days to resolve the disputes amicably. If either party escalates the dispute to PayPal, it will review the case and adjudicate within 10 days based on the evidence from both parties."
[4] https://developer.paypal.com/disputes/disputes-lifecycle — Disputes lifecycle stages reference
    > "The inquiry stage occurs immediately after a customer initiates a dispute by reporting a problem in the Resolution Center. The customer and merchant attempt to resolve the dispute for a 20-day period without escalation to PayPal."
    > "WAITING_FOR_BUYER_RESPONSE. The dispute is waiting for a response from the buyer. The buyer actions available are provide-evidence and cancel."
    > "These actions are available only in the sandbox: settle dispute, create dispute, and update dispute status."
[5] https://developer.paypal.com/disputes/reasons-evidence — Dispute reasons and evidence
    > "Use the Show dispute details response to determine the required evidence. The reason and evidences.evidence_type parameters denote the dispute reason and the evidence type respectively."
    > "The buyer did not receive the merchandise or service."
[6] https://developer.paypal.com/disputes/supported-file-sizes-types — Supported file types and sizes
    > "Ensure the files meet the following criteria:"
[7] https://developer.paypal.com/disputes/set-up — Set up accounts and environment (buyer-side credentials)
    > "To create disputes or change dispute reasons as a buyer using the Disputes API, you need to set up buyer-side credentials."
    > "You need to obtain buyer consent to create disputes or change dispute reasons on behalf of your sandbox personal account (buyer) using the Disputes API."
    > "Contact your PayPal account manager to add the following scopes to your REST app:"
[8] https://developer.paypal.com/disputes/test-go-live — Test and go live (sandbox dispute simulation)
    > "You can create disputes as a buyer using this endpoint and test how to handle them in the sandbox environment."
    > "This is a sandbox-only endpoint. You cannot use it to create disputes in the live environment."
    > "You can change the reason for a dispute using this endpoint in the sandbox environment."
    > "This is a sandbox-only endpoint. You cannot use it to change dispute reasons in the live environment."
[9] https://developer.paypal.com/platforms/disputes/handle-disputes/use-disputes-api — Use Disputes API (lifecycle actions)
    > "Use the HATEOAS links to understand the actions available at any stage of the dispute case lifecycle."
    > "PayPal may request additional evidence multiple times throughout the dispute's lifecycle and the WAITING_FOR_SELLER_RESPONSE status indicates that you need to provide evidence."
[10] https://developer.paypal.com/docs/multiparty/disputes-chargebacks/webhooks — Subscribe to Disputes webhooks
    > "Webhooks : Case creation: CUSTOMER.DISPUTE.CREATED Merchant response for evidence submission: CUSTOMER.DISPUTE.UPDATED Case resolution: CUSTOMER.DISPUTE.RESOLVED"
[11] https://www.paypal.com/us/legalhub/paypal/buyer-protection?locale.x=en_US — PayPal Purchase Protection program (US Legalhub)
    > "Item Not Received Dispute must be opened within 180 days of the date you sent the payment to the seller."
    > "Significantly Not as Described Dispute must be opened (i) within 30 days of the date of delivery or fulfillment (as applicable) of an order or (ii) within 180 days of the date you sent the payment to the seller, whichever is sooner."
    > "Attempt to contact the seller to resolve your issue directly before filing a claim through the Resolution Center."
    > "Respond to PayPal’s request for documentation and other information within the time requested."
[12] https://www.paypal.com/us/legalhub/privacy-full — PayPal Privacy Statement
    > "We collect your personal information, for example, when you open an account or provide account information"
    > "data controller of your Personal Information is the PayPal entity established in the country or jurisdiction where you reside"
