# Job’z hackathon submission plan

Prepared October 7, 2026. This is a planning document and draft application material. Nothing has been registered, uploaded, published, or submitted by this chat. The user reports participating; account registration and eligibility have not been independently verified.

## Verified event facts

The PayPal AI Hackathon submission window is October 1–November 12, 2026; the deadline is noon Pacific on November 12 (noon Vancouver time). Judging ends December 15 at 08:00 Pacific. Existing projects need significant work during the entry period and an explanation of those changes. Entries must meet residency, age, ownership, and other eligibility conditions; a Vancouver timezone alone does not establish residence. [Official rules](https://paypalaihackathon.devpost.com/rules/)

Required deliverables are a working PayPal-sandbox-plus-AI application, project description, runnable demo or hosted link, public open-source repository with a license and setup materials, and a public YouTube demonstration under three minutes. English materials or translations are required. Judges must have free testing access through judging. [Requirements](https://paypalaihackathon.devpost.com/), [rules](https://paypalaihackathon.devpost.com/rules/)

Evaluation equally weighs technical implementation, design, impact, innovation, and presentation. Best Use of PayPal + AI is a relevant award to target. [Event criteria](https://paypalaihackathon.devpost.com/)

Devpost's connector returned an internal error. Public rules, overview, updates, and FAQ were inspected instead. Account-specific form questions and upload fields still need inspection in the actual submission form. Do not assume this checklist is the entire form.

The [FAQ](https://paypalaihackathon.devpost.com/details/faqs) explicitly discusses excluded residences including Brazil and Quebec. Check the full eligibility terms for every teammate; ability to register is not eligibility confirmation. The [updates page](https://paypalaihackathon.devpost.com/updates) includes a PayPal setup-session recording and links to developer resources.

## Positioning

Working project name: Job’z.

Tagline candidate: “Pay it now or work it out. AI billing for independent service businesses.”

One-sentence pitch: “Job’z turns a cleaner's job notes into a reviewed bill, helps customers question a specific charge, and collects the agreed amount through PayPal.”

Lead with the owner and customer's experience. Voice input is the opening; the approved correction and successful payment are the demonstration's payoff. Describe invoice generation as a competitive baseline, and the shared question-to-correction workflow as the product hypothesis being tested.

Do not claim autonomous arbitration, guaranteed fairness, prevented chargebacks, production merchant onboarding, or measured time savings without evidence. An invoice correction before payment is not a refund.

## Mapping the story to judging

| Dimension | Evidence to prepare |
| --- | --- |
| Technical execution | Actual sandbox capture, revision binding, timeout recovery test, grounded AI output. |
| Design | Three understandable screens; both roles see what changed; clear processing and error states. |
| Impact | Specific independent-cleaner problem, interview observations if obtained, measured admin steps/time. |
| Innovation | Demonstrate how a bill question becomes a reviewed correction in the payment flow. Explain the distinction from ordinary voice invoicing honestly. |
| Presentation | One uninterrupted story with a visible amount change and verified payment result. |

Sponsor tools are optional. Consider Render only if hosting is useful and approved; do not introduce a sponsor dependency merely to list more tools.

## Draft project write-up

The following is planning copy. Rewrite it against implemented features and actual results before posting.

**Inspiration:** A small service business often has to finish the physical job and then start a second job: reconstructing the bill and answering questions about it. We want to make that conversation easier for both the owner and the customer.

**What we plan to build:** Job’z accepts a short job description, prepares an itemized bill for owner review, and gives the customer two choices: pay or ask about a charge. When an adjustment is appropriate, the owner approves a revised bill and the customer pays its current amount through PayPal.

**How we plan to build it:** A responsive React interface, a Python billing service, structured AI extraction, and PayPal sandbox checkout. AI proposes explanations and changes. Application code controls money calculations, permissions, and payment state.

**Core challenge:** A bill can change while a customer is trying to pay. The intended solution binds payment attempts to a specific approved revision and reconciles uncertain provider responses before allowing another attempt.

**What to report after building:** Actual model quality, sandbox evidence, failure cases fixed, observed pilot reactions, and the implemented feature boundary. Replace all prospective statements above with accurate results.

**Next:** Validate with independent cleaners, expand issue types, and investigate compliant merchant onboarding before any commercial rollout.

Proposed tools, not yet an actual built-with list: PayPal Orders API, PayPal JavaScript SDK, Python, FastAPI, React, TypeScript, SQLite, Groq, Whisper, GPT-OSS, Docker. List only those used in the delivered build.

## 2 minute 40 second demo script

| Time | Show | Say / establish |
| --- | --- | --- |
| 0:00–0:15 | Cleaner and job screen | Who it serves and the administrative problem. |
| 0:15–0:45 | Speak/upload “Three hours, plus the oven”; review CAD 185 | The AI extracts the work; the owner checks it. |
| 0:45–1:00 | Customer's bill and the two actions | Payment and clarification share the same bill. |
| 1:00–1:20 | Customer asks about the oven | AI locates the questioned charge without treating the claim as proven. |
| 1:20–1:50 | Owner confirms it was skipped; approves CAD 150 revision | Show the original and revised line items and approval record. |
| 1:50–2:25 | Customer reviews and pays using PayPal sandbox | Show actual capture completion and receipt for CAD 150. |
| 2:25–2:40 | Final workflow and scope | State observed results and that the prototype uses one fictional merchant in sandbox. |

Use original assets and narration. Record the actual working application. If edited for time, make transitions clear; do not present mocked provider results as live integration. Avoid visible credentials or personal records.

## Delivery checklist

By October 14:

- [ ] Confirm registration, eligibility, available build time, and provider access.
- [ ] Save the baseline commit and intended reused components.
- [ ] Complete the sandbox feasibility check.

By November 4:

- [ ] Freeze the core workflow; cut optional features if it is incomplete.
- [ ] Save actual evaluation and payment-test results.
- [ ] Confirm a fresh installation works; pick local judge access or approved hosting.

November 5–9:

- [ ] Choose the project's open-source license and preserve dependency/source notices. MIT is a recommendation, not yet a selected license.
- [ ] Prepare public repository contents after a secret/private-data review. Document exactly what existed before and what was added.
- [ ] Put setup, environment variable names, sandbox buyer steps, owner login access, and known limitations in README. Provide credentials through controlled judge instructions; API secrets remain server-side.
- [ ] Record and upload the demo when authorized; verify it from a signed-out browser.
- [ ] Finalize screenshots, description, actual tools, testing steps, and any form-specific answers.

November 10, internal target 17:00 Vancouver time:

- [ ] Inspect and complete every actual Devpost field.
- [ ] Check repository, license, video, and demo access as a judge would.
- [ ] Obtain final authorization to submit the concrete entry; submit and verify confirmation and public project URL. Saving a draft is not submission.

After submission:

- [ ] Preserve the submitted commit and reproducible setup.
- [ ] Maintain judge access, provider budget, and any hosting through the required testing period.
- [ ] Correct operational access problems without silently changing the evaluated feature scope.

## Current readiness

Research, design, and build/submission plans exist. Application, tests, model measurements, user validation, video, public repository, live form completion, and submission are outstanding. No claim of readiness or submission is made.
