---
name: AllowAgent — Customer payment controls
description: A PayPal-inspired customer dashboard for reviewing AI payment requests
colors:
  paypal-blue: "#0070E0"
  paypal-navy: "#003087"
  canvas: "#F5F7FA"
  surface: "#FFFFFF"
  text: "#141719"
  text-secondary: "#586272"
  border: "#DDE2E8"
  border-input: "#A4AFBB"
  selection: "#CDEAFF"
  selected-background: "#EDF5FF"
  selected-border: "#A6C9EF"
  selected-icon: "#DBEAFF"
  icon-background: "#F0F3F7"
  avatar-background: "#EEF2F7"
  avatar-text: "#364A64"
  tooltip: "#142941"
  hover-background: "#EAF2FC"
  control-hover: "#EEF2F6"
  divider: "#EDF0F3"
  navy-hover: "#001F5E"
  navy-active: "#001745"
  navy-focus-text: "#001C48"
  header-secondary: "#E0E8FF"
  header-focus: "#91DBFF"
  header-border: "#FFFFFF70"
  header-divider: "#FFFFFF66"
  header-active: "#FFFFFF1C"
  header-hover: "#FFFFFF29"
  header-help-hover: "#FFFFFF22"
  switch-off: "#707B89"
  status-safe: "#17683C"
  safe-background: "#EDF7F0"
  safe-text: "#14552F"
  status-review: "#805400"
  review-background: "#FFF6E6"
  review-text: "#734D00"
  status-danger: "#B02B2B"
  danger-background: "#FFF0EE"
  danger-text: "#922121"
  policy-background: "#FFF4E5"
  policy-text: "#694400"
  modal-backdrop: "#071C38A6"
  tooltip-shadow: "#001C4826"
  modal-shadow: "#001C4833"
typography:
  page: { fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif', fontSize: "2.375rem", fontWeight: 600, lineHeight: 1.15 }
  page-mobile: { fontFamily: '"DM Sans", sans-serif', fontSize: "1.875rem", fontWeight: 600 }
  modal: { fontFamily: '"DM Sans", sans-serif', fontSize: "1.5rem", fontWeight: 600 }
  title: { fontFamily: '"DM Sans", sans-serif', fontSize: "1.25rem", fontWeight: 600 }
  subheading: { fontFamily: '"DM Sans", sans-serif', fontSize: "1rem", fontWeight: 600 }
  body: { fontFamily: '"DM Sans", sans-serif', fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.55 }
  label: { fontFamily: '"DM Sans", sans-serif', fontSize: "0.875rem", fontWeight: 500 }
  supporting: { fontFamily: '"DM Sans", sans-serif', fontSize: "0.8125rem", fontWeight: 400 }
  note: { fontFamily: '"DM Sans", sans-serif', fontSize: "0.75rem", fontWeight: 400 }
  currency-unit: { fontFamily: '"DM Sans", sans-serif', fontSize: "0.6875rem", fontWeight: 400 }
  brand: { fontFamily: '"DM Sans", sans-serif', fontSize: "1.625rem", fontWeight: 700 }
  brand-mobile: { fontFamily: '"DM Sans", sans-serif', fontSize: "1.3rem", fontWeight: 700 }
  amount: { fontFamily: '"DM Sans", sans-serif', fontSize: "1.875rem", fontWeight: 500 }
  approval-amount: { fontFamily: '"DM Sans", sans-serif', fontSize: "2.25rem", fontWeight: 500 }
  base: { fontFamily: '"DM Sans", sans-serif', fontSize: "16px", fontWeight: 400 }
  code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: "0.75rem", fontWeight: 400 }
rounded:
  input: "6px"
  code: "8px"
  selection: "10px"
  callout: "12px"
  panel: "16px"
  dialog: "20px"
  button: "24px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  panel: "28px"
  page: "40px"
---

# Customer payment dashboard

<!-- impeccable:design-schema 1 -->

The user approved a customer payment dashboard on October 16, 2026. The supplied local references are the visual authority: restrained PayPal blue navigation, open white surfaces, calm type, prominent amounts, and direct payment actions. The previous developer-console treatment is superseded for this surface. This is an independent demo, not an official PayPal account interface.

## Typography and rhythm

Use one locally hosted DM Sans family at 400, 500, 600, and 700. It is an open-licensed substitute chosen for this project, not a claim to use PayPal's proprietary typeface. The fonts and SIL Open Font License live in `public/fonts/`. Do not depend on external Google Fonts requests at runtime or mix in Futura for headings.

Page title 38px/600, section titles 20px/600, recipient names 16px/600, primary content and actions 15px, supporting labels 13px, notes 12px. Amounts use tabular figures. Currency units may be 11px, but never use that size for essential instructions. Sentence case throughout; monospace only in the rule editor and developer details.

Keep related labels close. Give separate tasks 24px or more of separation. White panels have a single quiet border and 16px corners. Reserve shadows for the approval dialog and contextual tips. Primary buttons use navy, 44px minimum height, and 24px corners; this customer-oriented direction intentionally replaces the former compact console button geometry.

## Information hierarchy

The main task is understanding a payment request and deciding what happens next. The desktop grid uses a quieter 350px settings column and a wider request column. The latter contains example selection followed by the current review. Below 850px, show examples, review, then settings; DOM order follows the mobile task order. Avoid a row of equally weighted technical panels.

- Global header: PayPal identity, AllowAgent name, Personal / Business switch, and demo environment help.
- Account strip: demo spending and limit, with an explained reset action.
- Introduction: “Your payments. Your rules.” and a single purpose statement.
- Settings: spending limits, expandable permitted actions, trusted recipients, presets, advanced rule file.
- Examples: plain-language names, recipient context, USD amount, and selected state. Do not present expected scenario outcomes as calculated results.
- Review: recipient, requested amount, actual result and reason, usual amount where available, four current checks, then the next action.
- Supporting details: original account citations and request evidence. Developer identifiers, JSON, read tools, hashes, and internal states remain in a nested disclosure.

## Messaging and truthfulness

Use “payment settings,” “trusted recipients,” “automatic payment limit,” “price increase limit,” and “payment review.” Avoid “constitution,” “taint,” “cross-examination,” “red team,” and enum values in the primary task flow.

“Ready to pay” means eligible preview, never completed payment. Record-invoice actions say “Record payment”; refunds say “Refund.” An execution updates the demo account and changes the status. Blocked requests have no approval or payment action. Checks derive from the actual policy and evaluation; malformed rules must not display as passed. Scanning only reports configured suspicious patterns, not a universal security guarantee.

Clearly explain the local demo and that no real money moves. A usual amount is the historical average stored on the invoice, not proof that it is the correct current price. Approving the full amount is a one-time decision and does not update settings.

## Contextual help and review

Small information buttons reveal short tips on hover, focus, or tap. Tips have descriptive accessible names and stay inside the viewport; they close with Escape, outside press, scroll, or focus departure. They remain readable when the pointer moves over the tip. Keep essential consequences visible in the main interface. Action buttons also have concise consequence descriptions through native hover help.

Use a native modal dialog for the consequential approval decision. It traps focus, supports Escape and an explicit close button, and restores focus to the review action. Requested amount, historical amount, reasons for review, and additional invoice items precede the actions. Offer usual-amount amendment only when the evaluator permits it. Use explicit approve and decline labels.

## Privacy and verification

`docs/references-design/` is ignored and untracked; screenshots remain on disk. Never copy personal account content into UI fixtures, documentation, or screenshots of the app. Untracking does not remove earlier Git history.

Preserve pure previews and the existing execution boundary. All source files remain below 200 lines. Verify ready, review, blocked, and completed states, malformed rules, personal and business modes, mobile wrapping, and keyboard/tap help.
