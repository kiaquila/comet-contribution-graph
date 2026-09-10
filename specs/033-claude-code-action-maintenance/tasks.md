# Tasks: Claude Code Action maintenance

## Setup

- [x] T001 Confirm the isolated PR #41 worktree, branch, base, and head diff.
- [x] T002 Resolve the official v1.0.211 tag to the Dependabot-proposed commit.

## Implementation

- [x] T003 Preserve the two Dependabot SHA updates without workflow-policy
      changes.
- [x] T004 Add the complete feature-memory triad for this control-plane update.
- [x] T005 Update the durable dependency-maintenance record for v1.0.211.

## Verification

- [x] T006 Run `pnpm run preflight` on the final local head (115 tests passed).
- [ ] T007 Publish the final head and confirm all GitHub checks are green.
- [ ] T008 Request final-head Codex review and resolve every review thread.
- [ ] T009 Observe the two-minute merge-ready hold and merge PR #41.

## Process Memory

### Dead Ends

- The original Dependabot head could not pass `guard` by itself because
  repository control-plane changes require a complete feature-memory triad.

### Decisions

- Keep the update dependency-only: add evidence and feature memory without
  modifying workflow behavior.
- Use a full immutable commit SHA and retain the existing `# v1` annotation.
- Update the existing durable dependency-maintenance ledger rather than adding
  a second overlapping process document.

### Known Issues

- Claude review remains non-operational by repository policy; this maintenance
  update does not enable or validate that backend.
