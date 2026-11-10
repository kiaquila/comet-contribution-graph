# Tasks: npm minor and patch maintenance

## Implementation

- [x] T001 Merge the current `main` base into the Dependabot branch.
- [x] T002 Inspect the combined manifest and lockfile dependency resolutions.
- [x] T003 Retain the current base's workflow and security maintenance.
- [x] T004 Add complete feature memory for the dependency-only update.
- [x] T005 Update the durable dependency-maintenance ledger.

## Verification

- [x] T006 Complete a frozen lockfile install and run `pnpm run preflight`
      (180 tests passed).
- [ ] T007 Publish the final head and request current-head Codex review once.
- [ ] T008 Confirm the required GitHub checks and review threads are clear.
- [ ] T009 Observe the two-minute merge-ready hold and confirm the PR is merged.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because it lacked durable docs and
  a complete feature-memory triad.

### Decisions

- Keep the update dependency-only and preserve all validation configuration.
- Merge current `main` instead of reproducing its workflow maintenance.
- Treat the full lint, HTML-validation, type, build, distribution, formatting,
  and test chain as the compatibility evidence for the tooling update.

### Known Issues

- None identified during implementation.
