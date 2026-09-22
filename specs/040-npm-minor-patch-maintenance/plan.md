# Plan: npm minor and patch maintenance

1. Rebase the Dependabot branch onto the current `main` base and inspect the
   resulting manifest and lockfile diff.
2. Install with the frozen lockfile and confirm the requested direct and
   transitive dependency resolutions are stable.
3. Add complete feature memory and update the durable dependency-maintenance
   ledger.
4. Run the full local preflight chain, including lint, HTML validation, type
   checking, Action distribution verification, and tests.
5. Publish the final head, request Codex review from the maintainer account,
   resolve all findings, and confirm every GitHub gate is green.
6. Hold the merge-ready state for two minutes and merge PR #48.

## Risks

- The `@types/node` update changes its paired `undici-types` release; strict
  type checking must prove the repository remains compatible.
- html-validate 11.15.0 can expose new validation failures; configuration must
  not be weakened to make the update pass.
- Any later push invalidates current-head review evidence and restarts the
  review and stability-hold sequence.
