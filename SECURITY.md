# Security

## Report a concern

Use GitHub’s private vulnerability reporting when available. If the repository does not offer it, open an issue requesting a private contact channel. Keep account records, credentials and details that could expose another user out of public issues.

## Data and connections

The default dashboard uses a local rule-based assistant, synthetic records and an in-memory ledger. Selecting an example or generating a proposal previews a decision. Dashboard executions update that ledger. Resetting the demo restores its sample data.

| User action | Data and destination |
| --- | --- |
| Change a spending policy or provider preference | The browser can retain spending rules and non-secret preferences across reloads. |
| Test a PayPal Sandbox connection | The browser sends the supplied Sandbox client ID and secret to PayPal’s Sandbox OAuth endpoint. The resulting access token stays in memory. |
| Request a proposal from a cloud provider | The browser sends the prompt and payment-tool definitions to the selected OpenAI, Google Gemini or Groq service, using the key supplied for that provider. |
| Request a proposal from Ollama | The browser sends the prompt and tool definitions to the configured Ollama endpoint. Its operator can receive them. |

Connection credentials entered in Settings last for the current page. Reloading requires you to enter them again. The supported demo uses sample data. Custom rules and prompts may contain text you enter, so use synthetic details when sharing a browser or recording a demonstration.

## Scope of the checks

The policy parser rejects missing or malformed required rules. The evaluator compares requests with sample records, checks allowed tools and spending limits, and looks for configured suspicious text patterns. A proposal can still contain misleading text that those patterns do not recognize. Eligible actions and human-approved requests go through an execution gate that recomputes the request digest and checks for prior consumption. These checks and the in-memory ledger apply to this demonstration. [Evaluator](src/firewall/policy-evaluator.ts) · [Execution gate](src/firewall/approval-gate.ts) · [Sandbox client](src/paypal/live-client.ts)
