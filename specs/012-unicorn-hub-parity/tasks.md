# 012 — tasks

## Setup

- [x] T001 Confirm branch and isolated worktree:
      `codex/unicorn-hub-parity` under `.claude/worktrees/`.
- [x] T002 Refresh GitHub state and confirm no open PRs.

## Implementation

- [x] T003 Fix OSV `fast-uri` finding and update stale repo memory.
- [x] T004 Add config-driven repository control-plane helpers and preflight.
- [x] T005 Add SENAR templates, PR checklist, and docs.
- [ ] T006 Port event-driven AI Review marker/rerun flow.
- [ ] T007 Add branch-protection helper and docs.
- [ ] T008 Document intentionally skipped Unicorn Hub blueprint internals.

## Verification

- [ ] T009 Run targeted checks after each phase.
- [ ] T010 Run full `pnpm run preflight` and `pnpm run ci`.
- [ ] T011 Push branch, open ready PR, and post `@codex review`.

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

### Known Issues

- Branch protection is currently absent on `main`; this PR adds the helper but
  does not apply protection before the helper itself is reviewed.
