# AI and agent resources

The useful distinction is between an AI layer that helps a person understand a transaction and an agent layer that can take an action. Start with the former unless the transaction genuinely benefits from automation.

## PayPal-native AI links

| Resource | Link | Role |
| --- | --- | --- |
| AI Toolkit | [paypal/AI-Toolkit](https://github.com/paypal/AI-Toolkit) | Starter repository and examples. |
| AI docs | [docs.paypal.ai](https://docs.paypal.ai/) | PayPal's AI documentation hub. |
| Agent Toolkit | [Agent Toolkit quickstart](https://docs.paypal.ai/developer/tools/ai/agent-toolkit-quickstart) | Quickstart for agent integrations. |
| MCP server | [MCP quickstart](https://docs.paypal.ai/developer/tools/ai/mcp-quickstart) | Make PayPal actions available through MCP. |
| Agent tools | [Agent tools reference](https://docs.paypal.ai/developer/tools/ai/agent-tools-ref) | Inputs and supported actions. |

## Build-time context and API reliability

| Tool | Link | Best use |
| --- | --- | --- |
| APIMatic Context Plugin | [APIMatic detail page](https://paypalaihackathon.devpost.com/details/apimatic) · [context-plugin setup PDF](https://drive.google.com/file/d/1qa7Xkjt3PGJllHQVCP1IuE-XxlRNz4mN/view) | Give a coding agent accurate PayPal API context. |
| APIMatic claim form | [Free subscription form](https://docs.google.com/forms/d/e/1FAIpQLScc2oCgAFACm7d6H3R4mgzv-O34DdyVnLIBNiwmUNggr_-hhA/viewform) | Claim the participant subscription shown on the sponsor page. |
| Postman | [PayPal API collection](https://www.postman.com/paypal) · [Learn APIs by doing](https://www.postman.com/liftoff/learning-paths/building-with-ai/?utm_source=paypal-hackathon) | Explore, call, and document the API before coding. |

## Agent runtime and orchestration

| Tool | Link | Best use |
| --- | --- | --- |
| Astropods | [Docs](https://docs.astropods.com/) · [sponsor page](https://paypalaihackathon.devpost.com/details/astropods) | Deploy an agent with tools, knowledge, and observability. |
| KERNEL | [Docs](https://www.kernel.sh/docs) · [sponsor page](https://paypalaihackathon.devpost.com/details/kernel) | Let an agent operate a persistent browser session when an integration truly requires it. |
| Render Workflows | [Workflows docs](https://render.com/docs/workflows) · [sponsor page](https://paypalaihackathon.devpost.com/details/render) | Run background tasks, agent steps, and event pipelines. |
| Zapier MCP | [Quickstart](https://docs.zapier.com/mcp/get-started/quickstart) · [MCP docs](https://docs.zapier.com/mcp/home) · [overview](https://zapier.com/mcp) | Connect an approved agent action to external apps, including PayPal. |
| Elastic | [Getting started](https://ela.st/elastic-paypal-hackathon) · [docs](https://www.elastic.co/guide/index.html) | Search, vector retrieval, event analytics, and agent workflows. |

## A safe agent shape for the hackathon

1. User states an intent.
2. AI extracts facts and proposes a transaction.
3. The app shows the exact amount, recipient, and reason.
4. The user approves.
5. Deterministic code calls PayPal.
6. A verified webhook updates the record.
7. AI explains the result or prepares the next step.

Do not let a model invent an amount, silently select a recipient, or claim a payment succeeded without a verified PayPal event.

## Time-aware default

For a 5–8 hour weekly build schedule, use PayPal sandbox, one PayPal capability, one AI operation, and one visible sponsor tool at most. A simple reliable flow is more valuable in the demo than a multi-agent architecture that is difficult to verify.
