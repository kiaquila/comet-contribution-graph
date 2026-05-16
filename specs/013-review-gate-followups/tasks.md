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

## Review Iteration

- [x] T015 Route `ai-command-policy.mjs` bot-author check through
      `aiReviewMarkerAuthorLogin(config)` so customizing the marker author
      cannot leave a hardcoded `github-actions[bot]` bypass on the command
      policy entrypoint.
- [x] T016 Cover `extractAiReviewRequestMarker` negative cases for prose that
      mentions `unicorn-hub` or `comet:ai-review-request` without a full
      envelope, locking in the parser's literal substring contract.
- [x] T017 Document the Claude branch in `containsBlockingSeverity`: Claude
      reviews are gated by `AI_REVIEW_OUTCOME`, not by severity prose.
- [x] T018 Keep `github-actions[bot]` in the AI review request marker author
      allowlist while also trusting the configured `aiReviewMarkerAuthorLogin`,
      because the current command-policy workflow still posts marker comments
      with `GITHUB_TOKEN`.
- [x] T019 Add helper coverage proving a customized marker author does not
      reject the marker emitted by the existing workflow identity.
- [x] T020 Address OMX critic P1: scan all explicit Gemini severity markers so
      a leading `Low` marker cannot mask a later `Critical`, `High`, or
      `Medium` marker in the same review body or inline comment.
- [x] T021 Address OMX critic P2: keep explicit Markdown-emphasized Gemini
      severities such as `**Severity:** High` and `Severity: **Medium**`
      blocking.

## Process Memory

### Decisions

- Use `.comet-control` as the comet-specific policy directory instead of an
  upstream blueprint name.
- Keep backward compatibility for legacy AI review request markers but stop
  emitting the upstream-coupled marker name.
- Keep Gemini inline review handling conservative: missing explicit severity is
  still blocking.
- Treat `aiReviewMarkerAuthorLogin` as an additional trusted marker author
  while `github-actions[bot]` remains the actual marker author for the current
  workflow token path.
- Any explicit blocking Gemini severity marker wins over advisory markers in
  the same evidence body.
- Markdown emphasis around an explicit Gemini severity label or value does not
  make the marker advisory or invisible.

### Dead Ends

- `omx exec review --base origin/main "<prompt>"` and
  `omx exec review --uncommitted --base origin/main` are invalid CLI
  combinations; use the built-in base review mode without a custom prompt.
