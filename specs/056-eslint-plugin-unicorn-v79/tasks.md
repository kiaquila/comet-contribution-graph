# Tasks: eslint-plugin-unicorn v79 maintenance

## Setup

- [x] Confirm PR #67 base, head, branch, and dependency-only diff.
- [x] Review the official v79 release notes and compatibility requirements.
- [x] Merge the current `main` base after PR #66.

## Implementation

- [x] Preserve the direct Unicorn v79 update without lint-policy changes.
- [x] Resolve the lockfile for ESLint 10.14.0 and Unicorn 79.0.0.
- [x] Retain the merged dependency and security maintenance.
- [x] Add complete feature memory for the dependency-only update.
- [x] Update the durable dependency-maintenance ledger.

## Verification

- [x] Complete a frozen lockfile install.
- [x] Run prototype linting and `pnpm run preflight` on the final local
      implementation (180 tests passed).
- [ ] Publish the final head and request current-head Codex review once.
- [ ] Confirm the required GitHub checks and review threads are clear.
- [ ] Observe the two-minute merge-ready hold and confirm the PR is merged.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because it lacked durable docs and
  a complete feature-memory triad.
- Merging current `main` produced the expected lockfile conflict between ESLint
  10.14.0 and Unicorn 79.0.0 peer snapshots; resolving both sides independently
  would have dropped one of the selected versions.

### Decisions

- Keep the update dependency-only and preserve all lint configuration.
- Resolve the peer snapshot as Unicorn 79.0.0 on ESLint 10.14.0, then validate
  it with a frozen install.
- Do not enable or configure `unicorn/no-top-level-side-effects`; its v79
  behavior change is outside this maintenance scope.

### Known Issues

- None identified during implementation.
