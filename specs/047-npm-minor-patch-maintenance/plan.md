# Plan: npm minor and patch maintenance

1. Merge the current `main` base into the Dependabot branch and inspect the
   resulting manifest and lockfile diff.
2. Confirm the five requested direct dependency versions and corresponding
   transitive updates without changing repository validation policy.
3. Add complete feature memory and update the durable dependency-maintenance
   ledger.
4. Install from the frozen lockfile and run the full local preflight chain.
5. Publish the final head and request one trusted Codex review for that SHA.
6. Leave CI/review waiting, merge, and close/archive handling to the external
   automation.

## Risks

- Tooling updates can change lint, validation, formatting, or type behavior;
  the complete preflight chain is the compatibility boundary.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
