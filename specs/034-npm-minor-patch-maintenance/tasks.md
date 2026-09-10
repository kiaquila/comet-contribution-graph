# Tasks: npm minor and patch maintenance

## Setup

- [x] T001 Confirm the isolated PR #42 worktree, branch, original head, and
      post-PR-#41 `origin/main`.
- [x] T002 Merge the current `origin/main` into the PR branch without rewriting
      the Dependabot commit.

## Implementation

- [x] T003 Confirm the manifest and lockfile contain only the four proposed
      development-tooling updates and their dependency relationships.
- [x] T004 Add complete feature memory and update the durable maintenance
      record.

## Verification

- [x] T005 Install the final lockfile with `pnpm install --frozen-lockfile`.
- [x] T006 Run `pnpm run preflight` on the final local head (115 tests passed).
- [ ] T007 Publish the final head and confirm all GitHub checks are green.
- [ ] T008 Request final-head Codex review and resolve every review thread.
- [ ] T009 Observe the two-minute merge-ready hold and merge PR #42.

## Process Memory

### Dead Ends

- The original Dependabot head could not pass `guard` because grouped package
  changes require a complete feature-memory triad.

### Decisions

- Merge the new `main` into the branch so PR #41 lands first without rewriting
  Dependabot's signed dependency commit.
- Preserve the existing broad manifest ranges for ESLint and
  `eslint-plugin-html`; their resolved versions advance only in the lockfile.
- Do not relax validation configuration if a tool reports an incompatibility.

### Known Issues

- The missing Dependabot labels are administrative and do not affect build,
  review, or merge gates; label configuration is outside this PR.
