# Tasks: Native Codex review receipts

## Setup

- [x] Confirm kiaquila identity, fresh origin/main, protection, and isolated branch.
- [x] Reproduce legacy=true / receipt=false on c099495.

## Implementation

- [x] Strict receipt parsing and complete Codex evidence selection.
- [x] Created/edited wakeup and bounded active-run recovery.
- [x] Regression tests and durable review documentation.
- [x] Constrained read-only rollout with an immutable natively reviewed validator.

## Verification

- [x] Local preflight (154 tests in initial full run; 156 tests including the final real receipt fixture).
- [ ] Native Codex review on the final full head SHA; resolve all findings.
- [ ] Green gates, 120-second stable readiness, protected merge verification.

## Process Memory

### Dead Ends

- Context7 quota exhausted; use official GitHub Actions documentation.
- Rerunning the old default-branch parser after the genuine native receipt still
  fails. The connector did not submit the requested compatible formal review.

### Decisions

- Structured summaries only wake evaluation; their presence/status is no verdict.
- Preserve trusted-default-branch execution for privileged workflows.
- Initial deployment uses the existing workflow with read permissions only and
  a fixed reviewed validator SHA; no protection/backend changes or fake checks.
- Rollout guard rejects any target except open, ready PR #55 at its live head.
- Main checkout has unrelated untracked files and is eight commits behind;
  leave it untouched and implement in the repository helper's isolated worktree.

### Known Issues

- Ordinary PR gates still use the old default-branch parser until merge; perform
  the constrained dispatch only after final-head native review completes.

### Verification Evidence

- `node --test tests/helpers.test.mjs tests/rerun.test.mjs tests/codex-receipts.test.mjs tests/review-gate.test.mjs` covers the parser and real workflow gate entrypoint.
- The user-referenced connector receipt is retained in
  `tests/fixtures/codex-no-findings-receipt.json`, including its source URL.
- `pnpm run preflight` passed: feature memory, repository baseline, HTML/JS/TS,
  renderer/static/Action builds, bundle consistency, formatting, and full tests.
- `actionlint .github/workflows/ai-review.yml .github/workflows/ai-review-rerun.yml` passed.
- No change to the non-operational Claude backend or review selection policy.
- `tests/review-rollout.test.mjs` executes the actual inline workflow guard
  against permitted and forbidden contexts, including stale SHA/API failures.
