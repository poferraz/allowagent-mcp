# AllowAgent MCP — 5-Pass Self-Proof Implementation Plan
## Real PayPal Sandbox & Autonomous AI Agent Integration

**Branch:** `feature/paypal-ai-live-integration`  
**Standard:** 5-Pass Adversarial Self-Proof Framework (Security, UX, PayPal Realism, Simplicity/Correctness, Credibility)  
**Target:** 100% Hackathon-Ready Submission with Live Sandbox Calls, Real AI Tool-Calling, Cryptographic SHA-256, Reconciled Documentation, and <3-minute Demo Script.

---

## Executive Summary & Gap Remediation

| Hackathon Requirement / Finding | Current Repository Gap | 5-Pass Remediation Solution |
| :--- | :--- | :--- |
| **1. Actual PayPal Sandbox Integration** | `src/paypal/live-client.ts` returns mock ledger; UI doesn't talk to Sandbox API | Implement `LivePayPalClient` with real OAuth2 token exchange and real REST endpoints (`/v2/checkout/orders`, `/v2/invoicing/invoices`, `/v2/payments/captures/{id}/refund`), with connection test and credential management. |
| **2. Meaningful AI Functionality** | 6 static hardcoded scenario fixtures; regex-only scanner; no LLM connected | Implement `src/agent/agent-client.ts`: autonomous agent that accepts natural-language user instructions, reasons over financial intent, emits schema-compliant `@paypal/agent-toolkit` MCP tool calls into AllowAgent firewall. Supports live LLM providers (Gemini/OpenAI) + zero-credential local reasoner. |
| **3. Material Security (S4 Hash & Replay)** | `approval-gate.ts` uses 32-bit FNV hash labeled `sha256`; `executeAutonomousCall` lacks replay/consumption check | Implement pure FIPS 180-4 standard SHA-256 (`src/firewall/sha256.ts`); bind all payload parameters; enforce one-time atomic consumption on both autonomous and approved execution paths. |
| **4. Accurate Product & Repo Claims** | `PRODUCT.md` and `README.md` claim unimplemented features or contradict status | Reconcile `PRODUCT.md` and `README.md`: clearly document Dual-Mode architecture (Local In-Memory Sandbox vs. Live PayPal Sandbox), disclose AI tools used, explain how judges reproduce the flow. |
| **5. Required Video Deliverable** | No YouTube video or demonstration walkthrough script | Author `docs/DEMO.md` with complete, timestamped <3-minute demo script showing live agent prompt → firewall cross-examination → sandbox execution. Add video link placeholder in `README.md`. |

---

## The 5-Pass Self-Proof Plan

### Pass 1: Security Assurance & Default-Deny Hardening
1. **FIPS 180-4 Standard 256-bit SHA-256 (`src/firewall/sha256.ts`)**:
   - Pure TypeScript, zero external dependencies, strictly `<200 lines`.
   - Verified against official NIST vectors (`""`, `"abc"`, multi-block inputs).
2. **Comprehensive Canonical Binding (`src/firewall/approval-gate.ts`)**:
   - Canonical JSON serializer binding all consequential properties: `id`, `toolName`, `orderId`, `invoiceId`, `disputeId`, `subscriptionId`, `recipientName`, `recipientEmail`, `amountCents`, `baselineCents`, `currency`, `reason`.
   - Hash format: `sha256-${64_hex_digits}`.
3. **One-Time Consumption Invariant for ALL Execution Paths**:
   - `executeAutonomousCall` checks and registers `consumptionKey` (`${call.id}:${payloadHash}`).
   - `resolveApprovalDecision` checks and registers `consumptionKey`.
   - Replays, parameter mutations, or double-clicks throw immediately.

### Pass 2: Plug-and-Play UX & Real-Time Agent Experience
1. **Interactive AI Agent Prompt Bar (`src/ui/components/AgentPromptBar.tsx`)**:
   - Allows judges/users to prompt the AI agent directly:
     - Examples: *"Pay Sarah Jenkins $185 for the latest office cleaning"*, *"Refund customer $24 for damaged item on ORD-772"*, *"Send $140 to unverified supplier"*.
     - Or type any custom prompt to watch the AI reason and generate the tool call in real-time.
2. **Sandbox & AI Connection Badge (`src/ui/components/ConnectionSettingsModal.tsx`)**:
   - Status badge in top bar: `Live Sandbox` vs `In-Memory Sandbox`, `Live AI (Gemini/OpenAI)` vs `Local Agent Reasoner`.
   - Clean drawer/dialog to configure Sandbox Client ID / Secret and AI API Key, with 1-click Test Connection button.
3. **4-Stage Pipeline Live Visibility**:
   - Connects user natural-language prompt -> AI-generated MCP tool call -> AllowAgent Firewall inspection -> PayPal execution.

### Pass 3: PayPal Realism & Actual Sandbox Integration
1. **`LivePayPalClient` (`src/paypal/live-client.ts`)**:
   - Implements `PayPalGateway` with live sandbox network capabilities:
     - `POST https://api-m.sandbox.paypal.com/v1/oauth2/token` for OAuth 2.0 Client Credentials token.
     - `GET /v2/invoicing/invoices/{id}`: retrieves authoritative invoice state, line items, and balances.
     - `POST /v2/invoicing/invoices/{id}/payments`: records invoice payment in Sandbox.
     - `GET /v2/checkout/orders/{id}`: reads order status, gross amounts, and payer details.
     - `POST /v2/checkout/orders/{id}/capture`: captures approved order.
     - `POST /v2/payments/captures/{id}/refund`: executes refund against live capture.
     - `GET /v1/customer-disputes/{id}`: inspects dispute state.
2. **Fail-Closed Sandbox Resilience**:
   - If network fails, credentials expire, or resource doesn't exist, returns authoritative `UNAVAILABLE` or throws fail-closed error. Never falls back to mock to grant unauthorized spend!

### Pass 4: Implementation Simplicity & Meaningful AI Integration
1. **`AutonomousAgent` (`src/agent/agent-client.ts`)**:
   - Defines strict tool-calling schemas matching `@paypal/agent-toolkit`:
     - `pay_order`, `record_payment_for_invoice`, `create_refund`, `accept_dispute_claim`, `update_subscription`, `create_order`, `cancel_subscription`.
   - Supports:
     1. Live LLM API calls via direct REST (Gemini API / OpenAI API) with structured tool calling.
     2. Zero-config intelligent local agent reasoner that parses intent, extracts entity IDs and amounts, and emits identical tool calls when running offline or without API keys.
   - Outputs structured `{ toolCall: McpToolCall, rationale: string, confidence: number }`.
2. **Strict `<200 Lines` Enforcement**:
   - All newly created files adhere strictly to `<200 lines`. Verified via `npm run verify`.

### Pass 5: Evidential Credibility, Demo Impact & Documentation
1. **Reconcile `PRODUCT.md`**:
   - Remove any overstated claims; truthfully detail the dual-mode architecture (Local Demo vs Live Sandbox) and the exact AI integration boundary.
2. **Reconcile `README.md`**:
   - Document live Sandbox setup instructions (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`).
   - Document AI model configuration (`GEMINI_API_KEY`, `OPENAI_API_KEY`).
   - Add AI Tools Disclosure per Hackathon requirements.
   - Add link placeholder for the YouTube demo video.
3. **Demo Script (`docs/DEMO.md`)**:
   - Step-by-step <3-minute demonstration script for the video recording.
4. **Memory Update**:
   - Update `docs/memory/STATE.md` and `docs/memory/DECISIONS.md`.
