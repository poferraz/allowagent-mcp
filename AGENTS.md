# AGENTS.md — CaseReady AI Developer Guardrails

Welcome, AI Engineer. You are working on **CaseReady**, a customer-first PayPal dispute companion.
Before making any changes, memorize these non-negotiable rules:

## 1. Quick Commands
- `npm test` : Runs the complete Vitest test suite (<2s). MUST PASS after every edit.
- `npm run verify` : Runs TypeScript typecheck + tests.
- `npm run dev` : Launches local UI.

## 2. Technical Invariants (From PayPal OpenAPI 3.2 Audit)
1. **Never call `provide-supporting-info` during `INQUIRY` stage.** It is strictly restricted to `CHARGEBACK`, `PRE_ARBITRATION`, or `ARBITRATION`.
2. **In `INQUIRY` stage**, buyer messages and documents are sent via `POST /v1/customer/disputes/{id}/send-message`.
3. **`require-evidence`** can ONLY be called when status is `UNDER_REVIEW`.
4. **`provide-evidence`** is used ONLY when status is `WAITING_FOR_BUYER_RESPONSE`.
5. **`PayPal-Auth-Assertion`** is used ONLY in sandbox simulation for `create dispute` and `change-reason`. Do NOT attach it to general buyer operations.

## 3. Product & Ethical Guardrails
- **No Win Guarantees:** Never say "you'll win" or promise money back. The promise is a *verified next step*.
- **No Uncited Facts:** Every statement in a draft response must trace back to an `EXTRACTED_EVIDENCE` source with verbatim quote.
- **Mandatory Approval Gate:** No write call or clipboard copy can trigger without explicit user confirmation.
- **Keep Files Focused:** Keep all files under 250 lines. Do not create deep nested folders.

## 4. Key Directory Map
- `src/types/` : Central types for PayPal API, domain, and AI.
- `src/domain/` : Pure state machines and logic (dispute-machine, contradiction, question-tree).
- `src/paypal/` : API client and offline mock client.
- `fixtures/` : Sample JSON dispute objects and evidence texts for zero-secret testing.
