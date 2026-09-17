# Plan: npm minor and patch maintenance

1. Merge the current `main` base into the Dependabot branch and inspect the
   resulting manifest and lockfile diff.
2. Install with the frozen lockfile and confirm the requested direct and
   transitive dependency resolutions are stable.
3. Add complete feature memory and update the durable dependency-maintenance
   ledger.
4. Run the full local preflight chain, including lint, HTML validation, type
   checking, Action distribution verification, and tests.
5. Publish the final head, request Codex review from the maintainer account,
   resolve all findings, and confirm every GitHub gate is green.
6. Hold the merge-ready state for two minutes and merge PR #44.

## Risks

- ESLint 10.10.0 changes its cache stack and html-validate 11.14.0 expands its
  API and peer ranges; repository validation must prove these transitive changes
  do not alter current tooling behavior.
- Any later push invalidates current-head review evidence and restarts the
  review and stability-hold sequence.
