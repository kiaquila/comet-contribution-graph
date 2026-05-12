# 012 — tasks

## Setup

- [x] T001 Confirm branch and isolated worktree:
      `codex/unicorn-hub-parity` under `.claude/worktrees/`.
- [x] T002 Refresh GitHub state and confirm no open PRs.

## Implementation

- [x] T003 Fix OSV `fast-uri` finding and update stale repo memory.
- [x] T004 Add config-driven repository control-plane helpers and preflight.
- [x] T005 Add SENAR templates, PR checklist, and docs.
- [x] T006 Port event-driven AI Review marker/rerun flow.
- [x] T007 Add branch-protection helper and docs.
- [x] T008 Document intentionally skipped Unicorn Hub blueprint internals.

## Verification

- [x] T009 Run targeted checks after each phase.
- [x] T010 Run full `pnpm run preflight` and `pnpm run ci`.
- [x] T011 Push branch, open ready PR, and post `@codex review`.
- [x] T012 Review iteration 1: address Codex P2 on `ai-review-gate.mjs:162` by
      letting Gemini auto-reviews pass without a marker; add helpers test for
      acceptable Gemini native review.
- [x] T013 Review iteration 2: address Codex P1 on `ai-review-helpers.mjs:289`
      by adding `classifyGeminiNativeReview` / `latestGeminiNativeReviewResult`
      that inspect inline review comments for blocking severities; wire the
      gate to fetch `/pulls/{n}/comments` alongside reviews; add helpers tests
      covering inline severities and latest-review semantics.
- [x] T014 Review iteration 3: address Codex P2 on `ai-review-helpers.mjs:298`
      by gating `classifyGeminiNativeReview` to acceptable submitted review
      states (`APPROVED`/`CHANGES_REQUESTED`/`COMMENTED`) so dismissed and
      pending reviews no longer fall through to a pass; restore Prettier
      formatting on `tests/helpers.test.mjs` that broke `baseline-checks`
      in the previous push; add helpers tests covering `DISMISSED`/`PENDING`.

## Process Memory

### Dead Ends

- None yet.

### Decisions

- Use one feature folder for all six requested commits so the PR has a single
  coherent process memory trail.
- Keep docs under `docs_comet/`; do not import generic `docs_project/`.
- Pin `fast-uri` through `pnpm.overrides` instead of replacing `html-validate`;
  this clears the vulnerable transitive version without changing validator
  behavior.
- Keep `check-static-baseline.mjs` in place for now as a historical/product
  helper, but route `pnpm run check:repo` to the config-aware
  `check-repo-baseline.mjs`.
- Keep SENAR lightweight: structural gates require complete files, while the PR
  template and review docs ask humans/review agents to verify evidence quality.
- Preserve the comet-specific review backend policy while porting Unicorn Hub's
  event-driven gate: `codex` and `gemini` are enabled; Claude remains rejected.
- Do not apply branch protection from this unmerged branch; land the helper
  first, then run it from trusted `main`.
- Record skipped blueprint pieces explicitly so future parity work stays
  intentional instead of slowly copying Unicorn Hub internals by default.

### Known Issues

- Branch protection is currently absent on `main`; this PR adds the helper but
  does not apply protection before the helper itself is reviewed.
- `pnpm run preflight` passed locally after the six implementation commits; it
  includes the full `pnpm run ci` chain and 111 Node tests.
