# Lessons & Edge-Case Guardrails

1. **Never grant capabilities on missing directives:** Missing `Allowed Tools:` must yield `[]`, never all tools.
2. **Never mutate ledger state during preview evaluation:** Previewing scenarios or editing sliders must be side-effect-free.
3. **Always recompute payload hashes and enforce one-time approval consumption:** Prevents post-pause parameter mutation and replay attacks.
