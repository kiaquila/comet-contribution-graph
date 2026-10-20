# Tasks: eslint-plugin-unicorn v77 maintenance

## Implementation

- [x] T001 Merge the current `main` base into the Dependabot branch.
- [x] T002 Inspect the manifest and lockfile conflict for the plugin update.
- [x] T003 Normalize the plugin peer snapshot against ESLint 10.12.0.
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
- A non-frozen lockfile-only install retained the stale ESLint 10.11.0 peer
  snapshot after the current base introduced ESLint 10.12.0.

### Decisions

- Keep the update dependency-only and preserve all lint configuration.
- Retain the corresponding Dependabot transitive lockfile updates.

### Known Issues

- None identified during implementation.
