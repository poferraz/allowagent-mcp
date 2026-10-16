# AllowAgent MCP — Video Demonstration Script (<3 Minutes)

**Target Duration:** 2 minutes 45 seconds  
**Deliverable:** Public YouTube Demonstration for PayPal AI Hackathon  
**Format:** Screen recording with voiceover narration + on-camera introduction.

---

## Storyboard & Timing Breakdown

### Act 1: The AI Agent Spending Problem (0:00 – 0:30)
- **Visual:** Split-screen showing an AI Agent in a chat interface next to a PayPal developer dashboard.
- **Narrator (Voiceover):**
  > "Autonomous AI agents are transforming finance, but giving an LLM direct access to PayPal payment tools is terrifying. A single hallucination, price-creep invoice, or indirect prompt injection can drain accounts in seconds. Fuzzy LLM self-policing doesn't work. We need a deterministic, fail-closed spending firewall. Meet AllowAgent MCP."

### Act 2: Architecture & Spend Constitution (0:30 – 1:00)
- **Visual:** Show the AllowAgent command center running locally. Highlight the `PAYPAL.md` Spend Constitution on the right pane.
- **Narrator:**
  > "AllowAgent MCP intercepts tool calls from `@paypal/agent-toolkit` before any money moves. On the right, users configure `PAYPAL.md`—a plain-language spend constitution defining dollar caps, price-creep tolerances, and zero-trust vendor allowlists. If the rules are tampered with or malformed, it fails closed to zero dollars."

### Act 3: Autonomous AI Agent Prompt & Auto-Pay (1:00 – 1:35)
- **Visual:** 
  1. Click into the **AI Payment Assistant** prompt bar.
  2. Type: `"Pay monthly Metro Fiber internet bill for $28"`.
  3. Click **Ask Agent**.
  4. Show the AI Agent reason over intent, select `pay_order` with `ORD-101`, and submit into AllowAgent.
  5. Show the 4-Stage Firewall trace evaluate: Schema Valid, 0 Injections, Positive PayPal Record Match, within $40 auto-pay limit.
  6. Show verdict: `AUTO_EXECUTE` -> Click **Execute Payment**.
- **Narrator:**
  > "Watch this live. We prompt our AI assistant in natural language: 'Pay our monthly internet bill.' The agent reasons over our intent, selects `pay_order`, and submits the tool call. AllowAgent cross-examines the request against authoritative PayPal records, verifies that $28 matches the 3-month average, confirms the trusted vendor, and approves it for automatic settlement."

### Act 4: Intercepting Price Creep & Human-in-the-Loop Diff (1:35 – 2:15)
- **Visual:**
  1. Click suggestion: `"Pay Sarah's Eco Cleaning invoice for $185"`.
  2. Show firewall trace: Stage 3 detects that the historical baseline is $150, but the invoice proposes $185 (+23.3% creep, exceeding 10% tolerance).
  3. Verdict switches to `PAUSE_FOR_APPROVAL`.
  4. Click **Review Payment**.
  5. The accessible native Review Dialog appears, displaying:
     - Proposed: $185.00
     - Verified Baseline: $150.00
     - Delta: +$35.00 (Unapproved line item: Deep Sanitization)
  6. Click the primary button: **Amend to Baseline ($150.00)**.
  7. Show settlement executed at $150.00 with single-use SHA-256 digest.
- **Narrator:**
  > "Now, what happens when a vendor sneaks in unexpected charges? Our cleaner's invoice jumps from $150 to $185. AllowAgent catches the 23% price creep, pauses execution, and opens our Evidence Diff Modal. Instead of declining or overpaying, the operator clicks 'Amend to Baseline' with one tap. AllowAgent adjusts the payment to the verified $150 and settles it with an immutable, single-use SHA-256 digest that prevents replay attacks."

### Act 5: Defending Against Indirect Prompt Injection & Live Sandbox (2:15 – 2:45)
- **Visual:**
  1. Click on the suspicious invoice or dispute example: show `HARD_BLOCK` on spoofed vendor and prompt injection attack.
  2. Click **Settings** in the top header.
  3. Show the PayPal Sandbox Credentials inputs and click **Test PayPal Connection**.
  4. Show the green verified status: `Connected to PayPal Sandbox API (OAuth 2.0 verified)`.
- **Narrator:**
  > "AllowAgent also scans for indirect prompt injection inside invoice memos and blocks dispute surrender attacks cold. And unlike static mockups, AllowAgent connects directly to the real PayPal Sandbox platform via OAuth 2.0 client credentials, verifying live invoices, captures, and refunds on `api-m.sandbox.paypal.com`."

### Conclusion & Wrap-up (2:45 – 3:00)
- **Visual:** Return to the full command center view with all 42 tests passing in terminal.
- **Narrator:**
  > "With 42 automated tests, zero production vulnerabilities, and strict cryptographic safeguards, AllowAgent MCP gives developers and businesses the confidence to unleash autonomous payment agents safely. Your payments. Your rules."

---

## Quick Recording Checklist
- [ ] Terminal running `npm run dev` and `npm run verify` (42/42 tests passing).
- [ ] Browser window sized to 1920x1080 (clean 1080p).
- [ ] Microphone level checked; clear audio without background noise.
- [ ] Export as MP4 and upload to YouTube as Unlisted/Public.
- [ ] Update URL in `README.md` and Devpost submission form.
