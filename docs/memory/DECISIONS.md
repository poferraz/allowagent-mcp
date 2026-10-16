# Architectural Decision Records (ADRs)

## ADR-001: Clean-Slate Pivot to AllowAgent MCP
- **Decision:** Build **AllowAgent MCP** on a clean slate supporting both **Personal Wallet Mode** and **Business Back-Office Mode** via `PAYPAL.md` constitutions.

## ADR-002: Positive Resource Verification & Pure Preview Separation
- **Decision:** `evaluateToolCall` is 100% pure (`NOT_EXECUTED` on `AUTO_EXECUTE` eligibility) and requires `verifiedFactsComplete === true` from authoritative PayPal Read records before any call can be marked `AUTO_EXECUTE`.

## ADR-003: PayPal 2024–2025 Brand Refresh & Authentic Developer Console Theme
- **Decision:** Align AllowAgent MCP UX directly with the Pentagram 2024–2025 PayPal brand identity and Developer Console (`developer.paypal.com`) standards. Reject generic dark-cyberpunk "AI slop" in favor of authentic PayPal enterprise light-slate canvas (`#F5F7FA`), pure white container surfaces (`#FFFFFF`), authoritative PayPal Deep Navy header (`#001C48` to `#002991`), sharp de-rounded 2024 monograms, selective PayPal Blue (`#0070E0`) safe accents, and tabular financial figures.

## ADR-004: PayPal Console Layout, 4-Stage Trace, and Action Hierarchy
- **Decision:** Eliminate dark terminal boxes from light fintech surfaces; render syntax blocks in crisp light mode. Restructure Firewall Trace into 4 explicit discrete stages (Schema Validation, 3-Vector Scanner, Read Cross-Examiner, Spend Gate). In the human review modal, elevate "Amend to Baseline" as the primary PayPal Blue hero action, with balanced secondary override and reject actions.



## ADR-005: Customer Payment Dashboard & Plain-Language Reviews
- **Decision:** User approved replacing the primary developer-console presentation with a PayPal-inspired customer payment dashboard on 2026-10-16. Keep the PayPal palette and underlying policy/evaluation/execution model; foreground recipient, amount, decision, and next action. Use locally hosted DM Sans, sentence-case labels, open spacing, a quieter settings column, and expandable technical evidence. Example selection remains a pure preview and no longer auto-opens the approval dialog. Accessible hover/focus/tap tips explain unfamiliar settings; a native dialog protects approval focus. Distinguish payment execution, invoice-payment recording, and refunds. Derive all four displayed checks from policy/evaluation evidence.
- **Privacy:** Ignore and stop tracking `docs/references-design/`, retaining local screenshots. Existing Git history is not rewritten.

## ADR-006: 5-Pass Live PayPal Sandbox, Autonomous AI Agent & FIPS SHA-256
- **Decision:** Remediate all Hackathon submission requirements and adversarial audit gaps via 5-Pass Self-Proof:
  1. **Pass 1 (Security):** Replaced 32-bit FNV hash with FIPS 180-4 standard 256-bit SHA-256 digest (`src/firewall/sha256.ts`), binding all canonical payload properties, and enforced atomic one-time consumption for both autonomous and human-approved executions.
  2. **Pass 2 (UX):** Added interactive AI Payment Assistant prompt bar and unified Settings modal for live PayPal Sandbox and AI key configuration.
  3. **Pass 3 (PayPal Realism):** Implemented `LivePayPalClient` (`src/paypal/live-client.ts`) with OAuth 2.0 Client Credentials token exchange and real PayPal REST endpoints (`/v2/invoicing`, `/v2/checkout/orders`, `/v2/payments/captures`).
  4. **Pass 4 (AI Integration):** Implemented `AutonomousAgent` (`src/agent/agent-client.ts`) with `@paypal/agent-toolkit` schemas, live Gemini 2.5 / OpenAI GPT-4o tool-calling, and zero-key local reasoning fallback.
  5. **Pass 5 (Evidential Credibility):** Reconciled `PRODUCT.md` and `README.md` with implementation reality, added AI Tools Disclosure, and authored complete under-3-minute demonstration script in `docs/DEMO.md`.

