# Tasks: Native Codex review receipts

## Setup

- [x] Confirm kiaquila identity, fresh origin/main, protection, and isolated branch.
- [x] Reproduce legacy=true / receipt=false on c099495.

## Implementation

- [x] Strict receipt parsing and complete Codex evidence selection.
- [x] Created/edited wakeup and bounded active-run recovery.
- [x] Regression tests and durable review documentation.

## Verification

- [x] Local preflight (154 tests in initial full run; 156 tests including the final real receipt fixture).
- [ ] Native Codex review on the final full head SHA; resolve all findings.
- [ ] Green gates, 120-second stable readiness, protected merge verification.

## Process Memory

### Dead Ends

- Context7 quota exhausted; use official GitHub Actions documentation.

### Decisions

- Structured summaries only wake evaluation; their presence/status is no verdict.
- Preserve trusted-default-branch execution for privileged workflows.
- Main checkout has unrelated untracked files and is eight commits behind;
  leave it untouched and implement in the repository helper's isolated worktree.

### Known Issues

- Initial rollout requires native evidence accepted by the old default-branch gate.

### Verification Evidence

- `node --test tests/helpers.test.mjs tests/rerun.test.mjs tests/codex-receipts.test.mjs tests/review-gate.test.mjs` covers the parser and real workflow gate entrypoint.
- The user-referenced connector receipt is retained in
  `tests/fixtures/codex-no-findings-receipt.json`, including its source URL.
- `pnpm run preflight` passed: feature memory, repository baseline, HTML/JS/TS,
  renderer/static/Action builds, bundle consistency, formatting, and full tests.
- `actionlint .github/workflows/ai-review.yml .github/workflows/ai-review-rerun.yml` passed.
- No change to the non-operational Claude backend or review selection policy.
