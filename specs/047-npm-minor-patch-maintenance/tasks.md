# Tasks: npm minor and patch maintenance

## Implementation

- [x] T001 Merge the current `main` base into the Dependabot branch.
- [x] T002 Inspect the manifest and lockfile changes for the grouped dependency
      updates.
- [x] T003 Add complete feature memory for the dependency-only update.
- [x] T004 Update the durable dependency-maintenance ledger.

## Verification

- [x] T005 Complete a frozen lockfile install and run `pnpm run preflight`
      (157 tests passed).
- [ ] T006 Publish the final head and request current-head Codex review once.
- [ ] T007 Confirm the required GitHub checks and review threads are clear.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because it lacked durable docs and
  a complete feature-memory triad.

### Decisions

- Keep the update dependency-only and preserve all validation configuration.
- Retain the exact Dependabot manifest and lockfile changes after merging the
  current base.

### Known Issues

- None identified during implementation.
