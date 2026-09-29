# Tasks: npm minor and patch maintenance

## Implementation

- [x] T001 Merge the current `main` base into the Dependabot branch.
- [x] T002 Inspect the manifest and lockfile changes for the grouped dependency
      updates.
- [x] T003 Identify upstream `eslint-plugin-html` 8.2.1 as the documented fix
      for the ESLint 10.11 private-field failure and confirm it is still blocked
      by `minimumReleaseAge`.
- [x] T004 Add complete feature memory for the dependency-only update.
- [x] T005 Update the durable dependency-maintenance ledger.

## Verification

- [x] T006 Complete a frozen lockfile install and run `pnpm run preflight`
      (142 tests passed).
- [ ] T007 Publish the final head and request current-head Codex review.
- [ ] T008 Confirm every required GitHub gate is green and every review thread
      is resolved.
- [ ] T009 Observe the two-minute merge-ready hold and merge PR #50.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because it lacked durable docs and
  a complete feature-memory triad.
- ESLint 10.11.0 with `eslint-plugin-html` 8.2.0 crashes before lint rules run;
  weakening lint configuration would not fix the incompatible processor patch.

### Decisions

- Preserve the compatible `@types/node` and html-validate updates, but defer
  ESLint 10.11 until `eslint-plugin-html` 8.2.1 clears `minimumReleaseAge`.
- Keep validation rules unchanged and prove compatibility through the full
  repository preflight.

### Known Issues

- ESLint 10.11 remains intentionally deferred; Dependabot can propose it again
  after the compatible processor release becomes eligible.
