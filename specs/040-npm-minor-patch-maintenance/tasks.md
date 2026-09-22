# Tasks: npm minor and patch maintenance

## Implementation

- [x] T001 Rebase the Dependabot branch onto the current `main` base.
- [x] T002 Inspect the manifest and lockfile changes for the grouped dependency
      updates.
- [x] T003 Add complete feature memory for the dependency-only update.
- [x] T004 Update the durable dependency-maintenance ledger.

## Verification

- [x] T005 Complete a frozen lockfile install and run `pnpm run preflight`.
- [ ] T006 Publish the final head and request current-head Codex review.
- [ ] T007 Confirm every required GitHub gate is green and every review thread
      is resolved.
- [ ] T008 Observe the two-minute merge-ready hold and merge PR #48.

## Decision

- Preserve the Dependabot dependency set and validation policy; add only the
  feature-memory and durable evidence required by the repository contract.
