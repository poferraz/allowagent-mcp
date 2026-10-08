# Rescue giving — exploratory concept

October 7, 2026. Alternative to [Job’z](../jobz/README.md); not an approved design or implementation plan.

Status: saved and parked while brainstorming restarts from the official hackathon resources.

## User's direction

Easy setup for small nonprofit organizations such as dog rescues: a clear place for one-time and recurring donations, with meaningful AI assistance. Barney's Furry Friends is a reference organization, not a confirmed partner.

## Observations

- Barney's describes itself as volunteer-run. [Homepage](https://www.barneysfurryfriends.ca/)
- Its existing donation form already presents one-time and monthly options. Only the public page was read; no payment was attempted. [Donation page](https://www.barneysfurryfriends.ca/donate-2)
- Its rescue-van campaign describes transport needs and directs supporters to GoFundMe or e-transfer. [Van campaign](https://www.barneysfurryfriends.ca/donate-to-our-van)
- PayPal offers donation buttons with recurring-giving options. Exact Canadian account eligibility, sandbox behavior, and transaction synchronization need validation before selecting the integration. [PayPal donation tools](https://www.paypal.com/donate/buttons?locale.x=en_US)
- Givebutter already advertises AI-created campaign drafts and fundraising insights. A generic AI page writer is not a novel category. [Givebutter Magic](https://givebutter.com/magic)

## Strongest hypothesis to explore

An assistant that turns rescue paperwork into reviewed funding requests and factual donor updates.

Example: upload a fictional veterinary estimate and a short volunteer note. AI extracts the animal, treatment, estimated cost, dates, and missing information, with source references. A volunteer verifies the draft before publishing a donation page. PayPal handles the contribution. Later, new receipts and recovery notes support an organizer-approved progress update.

AI's useful work is interpreting mixed records, distinguishing estimates from paid expenses, matching updates to the right case, and identifying unsupported claims. Deterministic code calculates totals, funding gaps, and confirmed contributions. The model does not allocate money, diagnose animals, invent outcomes, or assert that a particular donor's dollars purchased a specific item without records.

Offer one-time support for a named need and recurring support for the rescue's general care program with clearly stated terms. Do not silently reassign restricted gifts or change recurring amounts. Monthly payment events must represent completed contributions, not merely an active subscription.

## Small demonstration

One fictional rescue, one case, one uploaded estimate, one reviewed appeal, one-time and monthly PayPal sandbox flows, and one source-linked update draft. Start by verifying whether both payment modes and their status events can be demonstrated within the available time. No nonprofit marketplace, cross-rescue matching, automated outreach, or fundraising promises.

## Questions before planning

1. Is the main volunteer burden launching appeals, tracking expenses, or keeping donors informed?
2. Can someone from the reference rescue describe their actual workflow and test a prototype?
3. What records could they safely share, and which must stay private?
4. Are donors interested in case progress, monthly organization reports, or both?

Measure volunteer time and factual corrections required; recurring-donor retention is a longer-term hypothesis, not something a short demo establishes. Use fictional or explicitly authorized material. No outreach, fundraising, account changes, or use of the organization's branding has been authorized.
