# Plan: npm minor and patch maintenance

1. Inspect the grouped manifest and lockfile update against the current main
   base.
2. Confirm that `eslint-plugin-html` 8.2.1 accompanies ESLint 10.11.0 and fixes
   the processor incompatibility encountered in the previous maintenance PR.
3. Install the exact lockfile with the repository's release-age policy intact.
4. Add complete feature memory and update the durable dependency-maintenance
   ledger.
5. Run the full preflight chain, including prototype linting, HTML validation,
   type checking, Action distribution verification, formatting, and tests.
6. Publish the final head, request Codex review from the maintainer account,
   resolve all findings, and confirm every required GitHub gate is green.
7. Hold the merge-ready state for two minutes and merge PR #52.

## Risks

- ESLint 10.11.0 is incompatible with `eslint-plugin-html` 8.2.0, so the
  lockfile must retain the 8.2.1 processor fix.
- Formatter or validator patch releases may expose previously accepted input;
  the full preflight chain detects those regressions without relaxing rules.
- Any later push invalidates current-head review evidence and restarts the
  review and stability-hold sequence.
