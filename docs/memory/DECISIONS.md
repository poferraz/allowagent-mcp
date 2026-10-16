# Architectural Decision Records (ADRs)

## ADR-001: Clean-Slate Pivot to AllowAgent MCP
- **Decision:** Build **AllowAgent MCP** on a clean slate supporting both **Personal Wallet Mode** and **Business Back-Office Mode** via `PAYPAL.md` constitutions.

## ADR-002: Positive Resource Verification & Pure Preview Separation
- **Decision:** `evaluateToolCall` is 100% pure (`NOT_EXECUTED` on `AUTO_EXECUTE` eligibility) and requires `verifiedFactsComplete === true` from authoritative PayPal Read records before any call can be marked `AUTO_EXECUTE`.
