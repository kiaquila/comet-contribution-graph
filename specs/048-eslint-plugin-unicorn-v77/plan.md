# Plan: eslint-plugin-unicorn v77 maintenance

1. Merge the current `main` base into the Dependabot branch and inspect the
   manifest and lockfile conflict.
2. Normalize the plugin peer snapshot against the current ESLint version while
   preserving the dependency-only scope and existing lint configuration.
3. Add complete feature memory and update the durable dependency-maintenance
   ledger.
4. Install from the frozen lockfile and run the full local preflight chain.
5. Publish the final head and request one trusted Codex review for that SHA.
6. Leave CI/review waiting, merge, and close/archive handling to the external
   automation.

## Risks

- A plugin major update can change lint behavior; the existing prototype lint
  and complete preflight chain are the compatibility boundary.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
