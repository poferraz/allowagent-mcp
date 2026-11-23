# AllowAgent product scope

AllowAgent helps a person answer three questions about a proposed payment. Who receives it? How does it compare with a familiar charge? Which decision can I take now?

## The review flow

Personal and Business modes provide different sample accounts and spending rules. Selecting an example evaluates it. The dashboard shows the recipient, amount, findings and next action. If the request needs review, the person opens a comparison with the verified historical amount. Some cases allow the person to amend the request to that baseline. Approving an exception applies to that request only.

The first version used a developer console. The maintainer chose a customer-facing layout that brings payment facts and actions forward. Supporting details retain the policy, evidence and tool information for someone who wants to inspect the decision. [Dashboard implementation](src/ui/App.tsx) · [Interface guidance](DESIGN.md)

## What the prototype implements

- The local assistant interprets supported sample requests. Optional model providers can propose tool calls from a prompt.
- The evaluator requires corroborating sample records, tool permissions and spending rules. Missing verification can block or pause a proposal.
- Payments and refunds in the dashboard update sample records in memory. The optional Sandbox connection test checks credentials with PayPal.
- The application hosts its own tool schemas and evaluator. The repository’s supported entry point is the Vite web app.

The example policies and scenarios are executable inputs to the demonstration. [Policy samples](fixtures/constitutions/) · [Scenario definitions](src/simulator/scenarios.ts) · [Connections and privacy](SECURITY.md)
