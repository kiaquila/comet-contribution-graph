# Tasks: html-validate 11.21 maintenance

## Setup

- [x] Confirm PR #69 base, head, branch, and dependency-only diff.
- [x] Review the official 11.19.0 through 11.21.0 changelog and Node engine
      compatibility.
- [x] Merge the current `main` base after PR #68.

## Implementation

- [x] Preserve the direct html-validate 11.21.0 update without validation-policy
      changes.
- [x] Confirm the lockfile deduplicates the package's `semver` resolution to
      7.8.6.
- [x] Retain the merged workflow maintenance and security-fixed dependency
      resolutions.
- [x] Add complete feature memory for the dependency-only update.
- [x] Update the durable dependency-maintenance ledger.

## Verification

- [x] Complete a frozen lockfile install and run `pnpm run preflight` (180 tests
      passed).
- [ ] Publish the final head and request current-head Codex review once.
- [ ] Confirm the required GitHub checks and review threads are clear.
- [ ] Observe the two-minute merge-ready hold and confirm the PR is merged.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because it lacked durable docs and
  a complete feature-memory triad.
- Context7 had no matching html-validate package documentation, so the official
  project changelog and checked-in package metadata were used instead.

### Decisions

- Keep the update dependency-only and preserve all HTML-validation
  configuration.
- Treat the existing HTML check and complete preflight chain as compatibility
  evidence for the intervening rule and metadata changes.

### Known Issues

- None identified during implementation.
