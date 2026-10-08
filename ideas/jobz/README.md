# Job’z — Pay it now or work it out

Planning package prepared October 7, 2026. No application has been implemented or submitted.

Job’z helps independent cleaners turn a job description into a reviewed bill, answer a customer's question about a charge, approve a correction, and collect payment through PayPal.

## Read in this order

1. [Research and feasibility](docs/research/2026-10-07-jobz-research.md) — competition, opportunity, API choices, cost, validation, and reuse.
2. [MVP design](docs/superpowers/specs/2026-10-07-jobz-design.md) — scope, experience, data, permissions, payment states, and success criteria.
3. [Build plan](docs/superpowers/plans/2026-10-07-jobz.md) — ordered tasks, files, interfaces, checks, and a 5–8 hours/week schedule.
4. [Hackathon submission plan](docs/hackathon/2026-10-07-submission-plan.md) — requirements, positioning, draft copy, demo script, and delivery checklist.

## Recommended scope

- One fictional cleaning business; CAD; English; PayPal sandbox only.
- Owner reviews an AI-drafted bill and shares a customer link manually.
- Customer pays or questions a specific charge.
- AI proposes an explanation, a request for clarification, or removal of a questioned line.
- Owner approves any correction; customer reviews the revised bill before paying.
- Local runnable build is the submission baseline. Hosting is optional and must preserve data.

Target effort: approximately 30 hours with coding assistance, plus up to 10 hours of contingency. The 25-hour fallback is defined in the build plan. Estimates are planning assumptions, not measured implementation times.

First build action: prove a CAD sandbox payment and capture-status reconciliation, then implement the narrow workflow. Credentials, customer validation, and model quality remain untested.
