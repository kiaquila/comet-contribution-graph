# Tasks: npm minor and patch maintenance

## Setup

- [x] Confirm PR #71 base, head, branch, and dependency-only diff.
- [x] Review the official release notes, current package guidance, engine
      requirements, and npm integrity metadata.
- [x] Merge the current `main` base after PR #70.

## Implementation

- [x] Preserve the direct ESLint 10.15.0, html-validate 11.21.1, and Prettier
      3.10.1 updates without configuration changes.
- [x] Confirm the lockfile updates the ESLint peer snapshot and required
      transitive packages without changing unrelated direct dependencies.
- [x] Retain the merged workflow maintenance and security-fixed dependency
      resolutions.
- [x] Add complete feature memory for the grouped dependency update.
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
  release notes and published npm metadata were used for that package.

### Decisions

- Keep the update dependency-only and preserve all lint, validation, and
  formatting configuration.
- Treat the frozen install plus the repository's complete preflight chain as
  compatibility evidence for the direct and transitive updates.

### Known Issues

- None identified during implementation.
