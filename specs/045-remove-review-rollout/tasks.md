# Tasks: Remove the native-review rollout exception

## Implementation

- [x] Verify fresh refs, GitHub identity, protection, and isolated worktree.
- [x] Remove the workflow exception and obsolete rollout tests.
- [x] Update the review contract and regression coverage.
- [x] Full preflight passed with 157 tests; actionlint passed.

## Delivery

- [ ] Native Codex review on the final head; resolve any findings.
- [ ] Observe the real gate validating final-head evidence using `main` scripts.
- [ ] All checks and threads ready for 120 seconds, then protected merge.

Runtime delivery evidence is recorded in the PR description and completion
comment so recording the final checks does not change the reviewed commit.

## Process Memory

### Decisions

- The pin was needed only to bootstrap PR #55. Its parser is now in `main`.
- Validate the normal PR-event job and automatic rerun path, not a separately
  named or manually published status.
- Preserve all existing evidence checks and least-privilege token settings.

### Dead Ends

- None for this cleanup. PR #55's historical bootstrap evidence remains linked
  from the durable review documentation.

### Known Issues

- None identified. Native review and runtime proof remain delivery gates.
