# Core PayPal map

This is the smallest useful path through the PayPal material.

## Choose the transaction primitive

| If the product needs to… | Start with |
| --- | --- |
| Accept one payment in a custom UI | [Checkout](https://developer.paypal.com/checkout/) and the [JavaScript SDK v6](https://developer.paypal.com/sdk/js/set-up) |
| Launch a very small payment page | [Payment Links and Buttons](https://developer.paypal.com/payment-links-buttons/overview) |
| Bill on a schedule | [Subscriptions](https://developer.paypal.com/platforms/subscriptions) |
| Ask someone to pay an itemized amount | [Invoicing](https://developer.paypal.com/invoicing/about) |
| Pay a worker, seller, or partner | [Payouts](https://developer.paypal.com/payouts/overview) |
| Support a cause | [Donations](https://developer.paypal.com/sdk/donate/) |
| Investigate failed or contested money | [Disputes](https://developer.paypal.com/platforms/disputes/overview) |
| Let a qualified buyer spread a purchase | [Pay Later](https://developer.paypal.com/pay-later/overview) |
| Keep the app in sync after money moves | [Webhooks](https://developer.paypal.com/api/webhooks/overview) |

## Build order for a new idea

1. Create a sandbox app in the [Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Run the [sandbox starter](https://github.com/paypaldev/getting-started-with-paypal-sandbox).
3. Prove one payment or payout with the smallest relevant SDK/API surface.
4. Add the webhook events that change the product state.
5. Add the AI action around the event: classify, draft, explain, route, or request approval.
6. Add the human review step before any consequential action.
7. Only then add a sponsor tool for the part of the demo it visibly improves.

## Pay Later constraints to design around

Pay Later is country-specific and eligibility-dependent. The official overview says that Canada supports Pay in 4 for eligible Canada-based merchants transacting in CAD, and that Pay Later requires a one-time payment integration. PayPal also requires the official Pay Later messaging to be rendered without rewriting it. Recurring-payment integrations are not eligible for Pay Later. Treat these as product constraints, not copywriting details.

Source: [Pay Later overview](https://developer.paypal.com/pay-later/overview).

## Webhook-first thinking

For an AI payment product, store a small internal state machine and update it from verified PayPal events:

| Internal state | Example event family | AI may do |
| --- | --- | --- |
| Action requested | Checkout, invoice, subscription, or payout request | Explain the next step or collect missing information. |
| Awaiting payment | Order or invoice created | Draft a reminder, never claim it is paid. |
| Payment confirmed | Capture or payment completion | Generate a receipt, unlock work, or update a dashboard. |
| Payment failed | Denied, declined, or failed event | Suggest a safe recovery path. |
| Refunded or disputed | Refund/dispute event | Pause dependent automation and prepare a review packet. |

The model can interpret context and draft actions. Deterministic code should authorize money movement, calculate totals, enforce idempotency, and verify webhook signatures.
