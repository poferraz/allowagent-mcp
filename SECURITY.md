# Security & Threat Model — AllowAgent MCP

## Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** feature for private reports.
Include reproduction steps, affected versions, and expected behavior. Do not post
credentials, private account records, or exploitable details in a public issue.
If private reporting is unavailable, open an issue asking for a private reporting
channel without disclosing the vulnerability.

This is an experimental demo, not an audited production payment system. The current
gateway uses sample records in memory and does not contact PayPal. Pattern matching
for suspicious instructions is advisory and cannot detect every prompt injection.

## Authorization Boundary
Untrusted external text -> Agent-selected MCP tool & arguments -> Deterministic Validator -> `PAYPAL.md` Constitution + Authoritative PayPal Read Ledger -> Pure Preview Verdict -> Explicit Human Confirmation / One-Time Executor -> PayPal Ledger / Sandbox.

## Core Security Guarantees (Conditional on Mediated Execution)
1. **Strict Line-Anchored `PAYPAL.md` Grammar:** Rejects trailing garbage (`$40.00garbage`), malformed percentages (`.%`), duplicate directives, and unknown tool tokens. Missing `Allowed Tools:` grants `[]` (zero tools).
2. **Resource-Bound Positive Verification:** Every write call must reference an existing PayPal ledger resource (`invoiceId`, `orderId`, `disputeId`, `subscriptionId`) whose authoritative vendor, amount, and delivery status match the request.
3. **Ledger-Sourced Untrusted Text Scanning:** Stage 2 scans both caller `untrustedContext` and ledger-stored `invoice.note` / `dispute.buyerMessage` as advisory defense-in-depth telemetry.
4. **One-Time Recomputed Digest Gate:** Approval resolution recomputes the canonical payload hash over all consequential fields, re-verifies baseline amounts from the ledger, and enforces one-time token consumption against replay/tampering.
