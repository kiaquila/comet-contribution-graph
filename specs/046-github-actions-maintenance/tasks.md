# Tasks: GitHub Actions maintenance

## Implementation

- [x] T001 Inspect the grouped Dependabot diff on the current `main` base.
- [x] T002 Confirm all three action references remain immutable SHA pins.
- [x] T003 Add complete feature memory for the dependency-only workflow update.
- [x] T004 Update the durable dependency-maintenance record.

## Verification

- [x] T005 Run `pnpm run preflight` on the final local head.
- [ ] T006 Publish the final head and request current-head Codex review once.
- [ ] T007 Confirm the required GitHub checks and review threads are clear.

## Decision

- Keep this update dependency-only: retain the Dependabot changes and add only
  the process evidence required by the repository contract.
