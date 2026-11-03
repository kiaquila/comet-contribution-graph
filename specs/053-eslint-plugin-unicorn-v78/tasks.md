# Tasks: eslint-plugin-unicorn v78 maintenance

## Setup

- [x] Confirm PR #64 base, head, branch, and dependency-only diff.
- [x] Review the official v78 release notes and compatibility requirements.
- [x] Merge the current `main` base after PR #63.

## Implementation

- [x] Preserve the direct Unicorn v78 update without lint-policy changes.
- [x] Retain the merged `minimatch` 11.0.1 security remediation.
- [x] Add complete feature memory for the dependency-only update.
- [x] Update the durable dependency-maintenance ledger.

## Verification

- [x] Complete a frozen lockfile install and run prototype linting.
- [x] Run `pnpm run preflight` on the final local implementation (180 tests
      passed).
- [ ] Publish the final head and request current-head Codex review once.
- [ ] Confirm the required GitHub checks and review threads are clear.
- [ ] Observe the two-minute merge-ready hold and confirm the PR is merged.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because it lacked durable docs and
  a complete feature-memory triad.
- The original head's OSV scan inherited vulnerable `minimatch` 10.2.6 from its
  stale base; merging current `main` carried forward the fix from PR #63.

### Decisions

- Keep the update dependency-only and preserve all lint configuration.
- Accept the v78 parser additions and optional TypeScript peer snapshot as the
  transitive dependency set produced by the frozen lockfile.
- Do not enable either new v78 rule during dependency maintenance.

### Known Issues

- None identified during implementation.
