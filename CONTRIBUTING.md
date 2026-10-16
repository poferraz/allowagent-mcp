# Contributing

Use Node.js 22 and run `npm ci`, then `npm run dev` for the local dashboard.

Create a focused branch, describe the customer-facing change, and open a pull request
against `main`. Include screenshots for UI changes and explain how to reproduce any
bug fix. Keep contributions respectful and relevant to the project.

Before opening a pull request:

```bash
npm run verify
npm run build
```

Every file in `src/` must stay below 200 lines. Keep previews free of execution side
effects, require positive account-record verification, preserve fail-closed policy
parsing, and route execution through the one-time approval boundary. See [AGENTS.md](AGENTS.md)
for the full invariants and [SECURITY.md](SECURITY.md) for security reports.

Use synthetic records in tests and screenshots. Never commit credentials, account
exports, or the local `docs/references-design/` folder. Do not include private data in
issues or pull requests. AI-assisted changes require the same review and verification
as other contributions; describe substantial generated contributions in the pull request.
