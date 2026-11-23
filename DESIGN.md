# AllowAgent interface guidance

The dashboard is for the person approving a payment. Use the recipient, requested amount, comparison with the usual charge and available action as the review’s main hierarchy.

- Keep **Personal** and **Business** modes clearly identified. A change to the selected example previews the outcome under the current rules.
- Use distinct language for paying an order, recording an invoice payment and issuing a refund. Make it clear when a decision changes the sample ledger.
- Show the reason for a pause and the verified baseline amount in the review dialog. Offer amendment only when supported by the evaluator. Preserve keyboard focus, explicit approval and decline controls, and an accessible way to close the dialog.
- Keep policy details, tool names and the underlying records available in a secondary disclosure. Pair status colours with text. Give controls accessible names and make help available by keyboard.
- Use the bundled DM Sans fonts and synthetic account records in screenshots. Preserve the font licence when distributing assets.

[Dashboard](src/ui/App.tsx) · [Review dialog](src/ui/components/ApprovalDiffModal.tsx) · [Presentation labels](src/ui/presentation.ts) · [UI checks](tests/ui/)
