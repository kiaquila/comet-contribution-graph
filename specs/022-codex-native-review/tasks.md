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

- [x] Local preflight (160 tests including the real receipt fixture and rollout guard).
- [x] Native Codex review on final head `03e6bd56a1eec6928193bf00a0bc83d3c3471c71`; no findings.
- [x] Green gates, 172-second stable readiness, protected squash merge `cd3c8eace2ecfd3382b2c531817b97d13a5c7cfd`.

[Delivery evidence](https://github.com/kiaquila/comet-contribution-graph/pull/55#issuecomment-6291246263)
records the native receipt, real gate, protection audit, and merge timestamps.

## Process Memory

### Dead Ends

- Context7 quota exhausted; use official GitHub Actions documentation.
- Rerunning the old default-branch parser after the genuine native receipt still
  fails. The connector did not submit the requested compatible formal review.
- Read-only manual dispatch 39424024329 genuinely passed on `f1cea1d608`, but
  GitHub kept the separate PR-event check red. Apply the same reviewed validator
  inside the existing PR job; retain the failed run and branch protection.

### Decisions

- Structured summaries only wake evaluation; their presence/status is no verdict.
- Preserve trusted-default-branch execution for privileged workflows.
- Initial deployment uses the existing workflow with read permissions only and
  a fixed reviewed validator SHA; no protection/backend changes or fake checks.
- Rollout guard rejects any target except open, ready PR #55 at its live head.
- At implementation start the main checkout had unrelated untracked files and
  was eight commits behind; use an isolated worktree and preserve those files.

### Known Issues

- The bootstrap blocker was resolved by PR #55. The validator is now on `main`;
  removal of the completed rollout exception is tracked in
  `specs/045-remove-review-rollout/`.

### Verification Evidence

- `node --test tests/helpers.test.mjs tests/rerun.test.mjs tests/codex-receipts.test.mjs tests/review-gate.test.mjs` covers the parser and real workflow gate entrypoint.
- The user-referenced connector receipt is retained in
  `tests/fixtures/codex-no-findings-receipt.json`, including its source URL.
- `pnpm run preflight` passed: feature memory, repository baseline, HTML/JS/TS,
  renderer/static/Action builds, bundle consistency, formatting, and full tests.
- `actionlint .github/workflows/ai-review.yml .github/workflows/ai-review-rerun.yml` passed.
- No change to the non-operational Claude backend or review selection policy.
- Initial rollout tests executed the inline guard against permitted and
  forbidden contexts. Those rollout-only tests were removed with the exception;
  the review suite now protects unconditional default-branch checkout instead.
