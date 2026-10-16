# AllowAgent MCP

[![CI](https://github.com/poferraz/allowagent-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/poferraz/allowagent-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Your payments. Your rules.** A payment-control demo that shows how an AI assistant
can follow spending limits, check account records, and ask before taking an unusual action.

Built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/).
Independent prototype; not an official PayPal product.

![Customer payment dashboard showing a request that needs review](docs/images/dashboard.png)

## Run locally

Requires **Node.js 22** and npm. No API keys or PayPal account are needed.

```bash
git clone https://github.com/poferraz/allowagent-mcp.git
cd allowagent-mcp
npm ci
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). For a production
preview, run `npm run build`, then `npx vite preview`.

## Try the demo

1. Choose **Personal** or **Business** to load sample settings and requests.
2. Select a payment example. Selection only previews the request; it never executes it.
3. Read the recipient, amount, decision, and checks. Use the info buttons for brief explanations.
4. For an eligible request, choose the displayed action. For an unusual request, choose
   **Review payment** to compare amounts, approve, adjust where supported, or decline.
5. Use **Reset demo** to restore the sample account records. Settings remain as configured.

| Example | Default result |
| --- | --- |
| Monthly internet bill · $28 | Ready to pay |
| An unexpected extra charge · $185 vs. $150 usual amount | Review the invoice-payment record |
| A suspicious invoice · $140 | Blocked |
| A shipping delay refund · $24 | Ready to refund |
| A disputed delivery · $320 | Blocked |
| A contractor payment · $420 | Review the invoice-payment record |

Results change with the selected rules. Recording an invoice payment is distinct from
sending a payment. All actions update the in-memory demo ledger; **no real money moves**.

## How it works

`PAYPAL.md` is a readable rule file for payment permissions. The demo applies four checks:

- **Payment details:** validate arguments and the referenced account resource.
- **Message safety:** flag configured suspicious instruction patterns in request and account text.
- **Account records:** compare the request with sample invoices, orders, delivery records, and history.
- **Spending rules:** enforce permitted actions, trusted recipients, and amount limits.

The implementation separates pure evaluation from execution. Only positively verified
requests can qualify for automatic execution, malformed rules fail closed, and execution
uses a recomputed request digest with one-time approval consumption. Technical evidence
is available under **View supporting details → Developer details**.

## Implementation status and limits

This repository contains a React/TypeScript dashboard, a deterministic policy engine,
six sample scenarios, and an in-memory PayPal-shaped ledger. The gateway factory always
returns `StatefulLedgerClient`. **Live PayPal Sandbox calls, an installed
`@paypal/agent-toolkit` integration, a running MCP server, and live LLM calls are not
implemented.** Tool names model the intended integration boundary.

The demo is not production-ready. Suspicious-text detection uses patterns, account state
resets on reload, and its approval boundary must be implemented server-side before use
with real accounts. See [SECURITY.md](SECURITY.md).

## Verify and navigate

```bash
npm run verify  # source line limits, TypeScript, and all 29 tests
npm run build   # production bundle
```

CI runs both commands for pushes to `main` and pull requests. Each source file must stay
below 200 lines.

| Path | Purpose |
| --- | --- |
| `src/ui/` | Dashboard, review dialog, and contextual help |
| `src/constitution/` | Rule parser and presets |
| `src/firewall/` | Validation, record checks, evaluation, and approval gate |
| `src/paypal/` | Gateway contract and sample ledger |
| `src/simulator/` | Sample requests and preview runner |
| `tests/` | Domain and UI regression checks |
| `docs/archive/` | Earlier research and concepts, not the current implementation |

## Contribute, security, and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and review expectations,
[DESIGN.md](DESIGN.md) for the UI direction, and [PRODUCT.md](PRODUCT.md) for product context.
Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

Code is [MIT licensed](LICENSE). Bundled DM Sans fonts use the
[SIL Open Font License](public/fonts/OFL.txt). PayPal names and marks belong to their
respective owners and are not covered by the project's MIT license.

## Hackathon preparation

The source, license, reproducible setup, and sample-data demo are available here.
A hosted demo, demonstration video, live integration evidence, and final Devpost submission
still need to be prepared. Current official requirements could not be retrieved from the
Devpost connector during repository setup; check the event requirements before submitting.
Nothing has been submitted to Devpost by this repository setup.
