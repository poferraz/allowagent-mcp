# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19, TypeScript 5.7, Vite 6, Tailwind CSS, Lucide Icons, Vitest

## Users

1. **Enterprise FinTech & Platform Engineers:** Building autonomous payment workflows using `@paypal/agent-toolkit` and MCP (Model Context Protocol). They require deterministic, zero-hallucination runtime guardrails around financial tool execution.
2. **SecOps & Risk Officers:** Responsible for securing AI agent deployments against indirect prompt injection, supplier invoice fraud, and unauthorized balance drain. They require verifiable audit trails and fail-closed security guarantees.
3. **Finance Administrators & End-Users:** Overseeing autonomous spending in either Personal Wallet or Business Back-Office modes. They need human-readable spend constitutions (`PAYPAL.md`) and instant approval workflows for anomalous spend.

## Product Purpose

AllowAgent MCP is a Constitutional Spend Firewall and Command Center for PayPal AI Agents. It monitors autonomous tool calls conforming to `@paypal/agent-toolkit` schemas, compiles human-authored `PAYPAL.md` policies into deterministic AST spend gates, cross-examines proposed payments against authoritative PayPal Sandbox or local ledger records, and blocks indirect prompt injection before money moves.

## Positioning

Unlike fuzzy LLM guardrails that rely on prompt-based self-policing, AllowAgent MCP operates as a deterministic reference monitor for financial tool calls:
- **Positive Verification:** Autonomous execution (`AUTO_EXECUTE`) is permitted strictly when authoritative PayPal read-records positively corroborate the claim.
- **Fail-Closed Compilation:** Malformed, missing, or contradictory directives in `PAYPAL.md` immediately lock limits to `$0.00`.
- **One-Time Hash-Bound Execution:** Evaluations produce single-use cryptographic SHA-256 digests preventing replay attacks and execution tampering.
- **Evidence-Based Diff Modal:** Human-in-the-loop approvals show historical baseline vs. proposed delta, allowing single-click baseline remediation.

## Operating Context

- Operates as a governance firewall between autonomous agent runtimes (Claude, GPT, Gemini) and the PayPal API / Sandbox Ledger.
- Integrates with `@paypal/agent-toolkit` tool schemas: `pay_order`, `record_payment_for_invoice`, `create_refund`, `accept_dispute_claim`, `update_subscription`, `create_order`, `cancel_subscription`.
- Supports dual gateway environments: a fast in-memory sandbox ledger for instant testing, and a live PayPal Sandbox API client (`api-m.sandbox.paypal.com`) using OAuth 2.0 client credentials.
- Includes an Autonomous AI Agent prompt interface supporting live Gemini/OpenAI tool-calling alongside a zero-configuration local financial reasoner.
- Provides a customer-facing payment dashboard with spending settings, plain-language decisions, and optional technical evidence.

## Capabilities and Constraints

- **Dual Operating Modes:** Personal Wallet Mode (capped daily spend, utility invoices, subscription safeguards) and Business Back-Office Mode (vendor invoices, refund thresholds, dispute surrender protection).
- **Pure Evaluation Previews:** Firewall evaluation is 100% pure and idempotent; state mutations occur only on explicitly verified execution.
- **Architectural Constraint:** Every file in `src/` must remain strictly under 200 lines (`<200 lines`), enforced by automated CI scripts.
- **Deterministic 4-Stage Pipeline:**
  1. Schema & Syntax Validation
  2. 3-Vector Taint & Prompt Injection Scanner
  3. PayPal Read-vs-Write Cross-Examiner
  4. Constitutional Spend Gate Evaluation

## Brand Commitments

- PayPal-inspired customer payment dashboard, guided by user-provided product references.
- Restrained blue navigation, white surfaces, generous spacing, prominent USD amounts, and a clear action hierarchy.
- Locally hosted, open-licensed DM Sans used consistently across the interface; it is not PayPal’s proprietary font.
- Plain-language settings and decisions. Developer details remain available through progressive disclosure.
- Accessible contextual help on hover, keyboard focus, and tap.
- Independent demo identity and clear disclosure that sample payments do not move real money.

## Evidence on Hand

- 42 passing automated tests spanning parser compilation, 3-vector taint detection, FIPS 180-4 SHA-256 cryptographic digests, PayPal Sandbox REST client, autonomous AI tool-calling, ledger cross-examination, and UI rendering.
- 6 pre-configured red-team scenarios reproducing real-world attack vectors (cleaner invoice price creep, spoofed vendor prompt injection, runaway refund drain, supplier wire fraud).
- Dual execution backends: fast in-memory sandbox ledger client and live PayPal Sandbox REST client (`api-m.sandbox.paypal.com`).

## Product Principles

1. **Fail-Closed by Default:** Any ambiguity, parse failure, or unverified assertion reduces autonomous spend limit to zero.
2. **Positive Verification Over Absence of Findings:** Safe verdicts require affirmative proof from PayPal read-records, not merely the absence of a detected threat.
3. **Pure Previews, Atomic Execution:** Previewing an action must never alter ledger state; execution must be atomic and digest-verified.
4. **Radical Transparency in Spend Diffs:** Never ask a human operator to approve an ambiguous prompt; present the exact dollar delta, historical baseline, and unapproved line items.
