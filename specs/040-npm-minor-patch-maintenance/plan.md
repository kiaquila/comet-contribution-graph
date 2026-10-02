# Plan: npm minor and patch maintenance

1. Merge the current `main` base into the Dependabot branch and inspect the
   resulting manifest and lockfile diff.
2. Reproduce the ESLint 10.11 failure, verify the upstream-supported fix is not
   yet eligible under `minimumReleaseAge`, and keep ESLint at 10.10.0 without
   weakening validation or supply-chain policy.
3. Install with the frozen lockfile and confirm the requested direct and
   transitive dependency resolutions are stable.
4. Add complete feature memory and update the durable dependency-maintenance
   ledger.
5. Run the full local preflight chain, including lint, HTML validation, type
   checking, Action distribution verification, and tests.
6. Publish the final head, request Codex review from the maintainer account,
   resolve all findings, and confirm every GitHub gate is green.
7. Hold the merge-ready state for two minutes and merge PR #50.

## Risks

- ESLint 10.11.0 changed an internal flat-config path used by
  `eslint-plugin-html` 8.2.0. The upstream fix exists in 8.2.1 but remains below
  the seven-day release-age threshold, so this PR deliberately defers the ESLint
  minor update rather than bypassing the supply-chain control.
- Any later push invalidates current-head review evidence and restarts the
  review and stability-hold sequence.
