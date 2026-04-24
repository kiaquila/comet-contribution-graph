# 009 — comet tail — tasks

## Code

- [ ] T001 — `src/renderer.ts`: shrink head radii (NUCLEUS 2.2→1.85, COMA_INNER 5.5→4.7, COMA_OUTER 9→7.65).
- [ ] T002 — `src/renderer.ts`: add `COMET_TAIL_RX=56`, `COMET_TAIL_RY=3.0` constants.
- [ ] T003 — `src/renderer.ts`: delete `TrailParticle` interface + `COMET_TRAIL` array.
- [ ] T004 — `src/renderer.ts`: prepend `<linearGradient id="tail-grad">` + `<filter id="tail-blur">` to the `<defs>` block.
- [ ] T005 — `src/renderer.ts`: in `renderComet()`, replace the ghost-particle loop with a single rotating gradient ellipse (`rotate="auto"`, `fill="url(#tail-grad)"`, `filter="url(#tail-blur)"`).

## Fixtures & snapshots

- [ ] T006 — commit `tests/fixtures/bcherny.json` (already on disk from 009 experiment fetch).
- [ ] T007 — regenerate snapshots: `UPDATE_SNAPSHOTS=1 pnpm test` (expect 8 animated snapshots to change; 8 reduced snapshots unchanged).
- [ ] T008 — spot-check `tests/__snapshots__/kiaquila.animated.svg`:
  - Contains `<ellipse cx="-56" ... fill="url(#tail-grad)" filter="url(#tail-blur)">`.
  - Contains exactly 1 `<ellipse>` element.
  - Contains 4 `<animateMotion>` (ellipse + coma outer + coma inner + nucleus).

## Process

- [ ] T009 — `.gitignore`: add `experiments/` and `prototypes/v2-local/`.
- [ ] T010 — Preserve `prototypes/v2-local/` (gitignored) with the 4 ellipse-blurred sample SVGs reviewed before the PR + mini index.html.
- [ ] T011 — `pnpm run ci` locally — must be green.
- [ ] T012 — commit (subject only, `feat(renderer):` prefix).
- [ ] T013 — push branch `experiment/009-comet-tail` as `feature/009-comet-tail`.
- [ ] T014 — open PR targeting `main`.
- [ ] T015 — user posts `@codex review` comment to trigger AI Review.
- [ ] T016 — address Codex findings (if any) — P1/P2 fix-and-push loop.
- [ ] T017 — merge when all checks green.

## Post-merge (not part of this PR)

- [ ] v1.3.0 Release — `gh release create`, publish-to-Marketplace checkbox, move `v1` tag.
- [ ] Update `project_009_comet_tail` memory entry with merge SHA + release version.
