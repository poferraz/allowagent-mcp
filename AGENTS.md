# AllowAgent contributor instructions

Run `npm run verify` and `npm run build` before submitting a change. The verification script checks the source size limit, TypeScript and the Vitest suite.

Preserve these behaviors when editing the evaluator or dashboard.

- A missing, duplicate or malformed required directive puts the policy into its fail-closed state. Missing tool permissions grant no tools.
- Automatic eligibility requires positive verification of the referenced records and no outstanding findings.
- Selecting an example, editing a policy and previewing a proposal leave the sample ledger untouched.
- Execution goes through `executeAutonomousCall` or `resolveApprovalDecision`. Keep the digest check and one-time consumption at that boundary.
- Use synthetic data in tests, screenshots and examples. Keep connection credentials out of persistent browser storage.

See the [contribution guide](CONTRIBUTING.md) and [security notes](SECURITY.md).
