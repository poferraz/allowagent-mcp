# Contributing

Use Node.js 22 and npm. Run `npm ci` and `npm run dev` to open the dashboard with its sample account.

Create a focused branch and open a pull request against `main`. Describe the customer-visible behavior and how to verify it. Use synthetic records in tests and screenshots. Keep API keys, PayPal account exports and personal design references out of the repository.

```sh
npm run verify
npm run build
```

The verification script checks that each source file has fewer than 200 lines, runs TypeScript and executes the Vitest suite. To run the browser check locally, install [the pinned Python test dependency](tests/e2e/requirements.txt) in a virtual environment. After building the app, run `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome python tests/e2e/real_browser_test.py` with Google Chrome installed. The test serves the build on loopback, uses synthetic credentials, and checks both reloads and storage migration. [Contributor instructions](AGENTS.md) · [Security reporting](SECURITY.md)
