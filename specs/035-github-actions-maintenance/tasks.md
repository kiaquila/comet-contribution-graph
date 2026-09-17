# Tasks: GitHub Actions maintenance

## Implementation

- [x] T001 Inspect the grouped Dependabot diff on the current `main` base.
- [x] T002 Confirm all four action references remain immutable SHA pins.
- [x] T003 Add complete feature memory for the dependency-only workflow update.
- [x] T004 Update the durable dependency-maintenance ledger.

## Verification

- [x] T005 Run `pnpm run preflight` on the final local head (115 tests passed).
- [ ] T006 Publish the final head and request current-head Codex review.
- [ ] T007 Confirm every required GitHub gate is green and every review thread
      is resolved.
- [ ] T008 Observe the two-minute merge-ready hold and merge PR #43.

## Decision

- Keep this update dependency-only: retain the Dependabot changes and add only
  the process evidence required by the repository contract.
