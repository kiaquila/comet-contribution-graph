# Tasks: npm minor and patch maintenance

## Implementation

- [x] T001 Merge the current `main` base into the Dependabot branch.
- [x] T002 Inspect the combined manifest and lockfile dependency resolutions.
- [x] T003 Retain the current base's `fast-uri` and `undici` security fixes.
- [x] T004 Add complete feature memory for the dependency-only update.
- [x] T005 Update the durable dependency-maintenance ledger.

## Verification

- [x] T006 Complete a frozen lockfile install and run `pnpm run preflight`
      (157 tests passed).
- [ ] T007 Publish the final head and request current-head Codex review once.
- [ ] T008 Confirm the required GitHub checks and review threads are clear.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because it lacked durable docs and
  a complete feature-memory triad.
- The original head failed `osv-scan` because it predated the security-fixed
  transitive resolutions already merged into `main` through PR #60.

### Decisions

- Keep the update dependency-only and preserve all validation configuration.
- Merge current `main` instead of reproducing or weakening its security fixes.

### Known Issues

- None identified during implementation.
