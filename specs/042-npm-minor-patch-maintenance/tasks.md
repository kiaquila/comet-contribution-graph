# Tasks: npm minor and patch maintenance

## Implementation

- [x] T001 Inspect the manifest and lockfile changes for the grouped update.
- [x] T002 Confirm ESLint 10.11.0 resolves with the compatible
      `eslint-plugin-html` 8.2.1 processor fix.
- [x] T003 Add complete feature memory for the dependency-only update.
- [x] T004 Update the durable dependency-maintenance ledger.

## Verification

- [x] T005 Complete a frozen lockfile install and run `pnpm run preflight`
      (142 tests passed).
- [ ] T006 Publish the final head and request current-head Codex review.
- [ ] T007 Confirm every required GitHub gate is green and every review thread
      is resolved.
- [ ] T008 Observe the two-minute merge-ready hold and merge PR #52.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because it lacked durable docs
  and a complete feature-memory triad.

### Decisions

- Accept the grouped update as proposed because the now-eligible
  `eslint-plugin-html` 8.2.1 release fixes the ESLint 10.11 processor crash.
- Keep all validation and supply-chain policies unchanged.

### Known Issues

- None identified after the frozen install and complete preflight.
