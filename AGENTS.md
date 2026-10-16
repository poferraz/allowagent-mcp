# AGENTS.md — AllowAgent MCP Developer & Multi-LLM Constitution

Welcome, Engineer. You are working on **AllowAgent MCP**, the Constitutional Spend Firewall & Red-Team Command Center for PayPal AI Agents (`@paypal/agent-toolkit`).

## 1. Quick Commands
- `npm test` : Runs the complete Vitest suite (<2s). MUST PASS after every edit.
- `npm run verify` : Runs `node scripts/check-source-lines.mjs && tsc --noEmit && vitest run`.
- `npm run dev` : Launches the 3-Pane Command Center UI.

## 2. Persistent Memory Protocol (Read & Update Every Task)
Before starting any task, read `docs/memory/STATE.md` and `docs/memory/DECISIONS.md`.
Before committing any task, update `docs/memory/STATE.md` with completed task status and test counts.

## 3. Non-Negotiable Technical & Security Invariants
1. **Strict `<200 Lines` Rule:** Every file in `src/` must remain strictly under 200 lines (`<200`), enforced by `scripts/check-source-lines.mjs`.
2. **Fail-Closed Compilation (`S1`):** If `PAYPAL.md` is missing required directives, contains duplicate directives, or has malformed numbers/tools, `parser.ts` MUST set `isFailClosed: true`, `maxAutoPayUsd: 0`, `maxAutoRefundUsd: 0`, and `allowedTools: []` on missing tool lists.
3. **Positive Verification Over Absence-of-Findings (`S2`):** `evaluateToolCall` may ONLY return `AUTO_EXECUTE` when `verifiedFactsComplete === true` and `findings.length === 0`. Missing resource IDs or missing ledger records emit `CRITICAL` (`MISSING_OR_INVALID_RESOURCE`).
4. **Pure Previews (`Q1`):** `evaluateToolCall` is 100% pure (`executionStatus: 'NOT_EXECUTED' | 'PAUSED' | 'BLOCKED'`) and NEVER mutates `PayPalGateway`.
5. **One-Time Hash-Bound Execution (`S4`):** Execution occurs exclusively in `executeAutonomousCall` / `resolveApprovalDecision`, which recomputes the canonical payload digest, verifies one-time consumption, and dispatches per-tool state transitions.
