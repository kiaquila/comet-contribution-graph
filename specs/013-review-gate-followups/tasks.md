# 013 — tasks

## Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm local `main` matches `origin/main` and no PRs are open.
- [x] T003 Create isolated worktree
      `.claude/worktrees/013-review-gate-followups` on
      `codex/review-gate-followups`.

## Implementation

- [x] T004 Rename `.unicorn-hub/config.json` to `.comet-control/config.json`
      and update config discovery, baseline policy, specs, and docs.
- [x] T005 Emit `comet:ai-review-request` markers while retaining legacy marker
      parsing for already-recorded `unicorn-hub:ai-review-request` comments.
- [x] T006 Add `aiReviewMarkerAuthorLogin` to config and use it when accepting
      AI review request marker comments.
- [x] T007 Make Codex blocking-priority matching case-insensitive.
- [x] T008 Tighten Gemini severity parsing so incidental phrases such as
      `high confidence` do not count as blocking severity markers.
- [x] T009 Warn when branch protection uses the default zero-approvals setting.
- [x] T010 Update helper tests and durable docs.

## Verification

- [x] T011 Run targeted script syntax checks.
- [x] T012 Run `node --test tests/helpers.test.mjs`.
- [x] T013 Run `pnpm run preflight`.
- [x] T014 Push branch, open a ready PR, and post `@codex review`.

## Process Memory

### Decisions

- Use `.comet-control` as the comet-specific policy directory instead of an
  upstream blueprint name.
- Keep backward compatibility for legacy AI review request markers but stop
  emitting the upstream-coupled marker name.
- Keep Gemini inline review handling conservative: missing explicit severity is
  still blocking.

### Dead Ends

- None yet.
