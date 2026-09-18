# Tasks: 038 — orbit layout

## Setup

- [x] T001 Confirm active feature folder and branch (`feature/038-orbit-layout`).
- [x] T002 Run baseline checks before editing (`pnpm test` green on `main` 47d80c2).

## Implementation

- [x] T003 `src/glyphs.ts`: extract `attrs`/`fmt`/`lerp`/`coreFill`, `renderPeak`, comet stack, shared `<defs>`.
- [x] T004 `src/renderer.ts`: consume glyphs; `renderGridSVG` + `renderCometSVG` dispatcher.
- [x] T005 `src/orbit.ts`: rings, sun, month ticks, data stars, peaks, looping comet, stats panel.
- [x] T006 `src/types.ts`: `Layout`, `RenderOptions.layout`, `RenderOptions.username`.
- [x] T007 `src/action.ts` + `action.yml`: `layout` input, validation, pass `username`.
- [x] T008 Tests: grid snapshots as `*.grid.*`, orbit takes default labels, `bcherny` added, orbit assertions, Action validation.
- [x] T009 `package.json` → `2.0.0`; `.gitignore` → `prototypes/cinematic-variants/`.
- [x] T010 Docs: README inputs/concept, `project-idea.md`, `github-action-target.md`.

## Verification

- [x] T011 Grid byte-identity check vs `main` snapshots (0 mismatches).
- [x] T012 Visual review of orbit samples (kiaquila / staks-sor / yeachan-heo / bcherny / empty-year / single-day) in Chrome.
- [x] T013 `pnpm run preflight` green locally (140 tests, check:dist, format, html, js).
- [ ] T014 PR opened, `@codex review` posted by the owner's `gh`, all checks green, threads resolved.
- [ ] T015 Merge after a 2-minute hold once merge-ready.

## Process Memory

### Dead Ends

- Rendering the orbit inside `renderer.ts` and importing it back for
  dispatch creates an ESM import cycle; solved by moving shared glyphs to
  their own module instead.
- `toLocaleString("en-US")` for thousands grouping depends on ICU presence;
  replaced with a regex so output is identical on every Node build.

### Decisions

- Default `layout` is `orbit` (owner decision 2026-09-17); grid stays as an
  explicit opt-out, hence `2.0.0`.
- `activeDays` is taken from `normalize()` rather than recomputed, so the
  panel and the star placement can never disagree.
- The comet orbits whenever the year has ≥1 active day (grid needs ≥2 peaks);
  empty years still get no comet per the fixed decision.
- Gallery generator stays local and gitignored; the spec records the choice.

### Known Issues

- Release `v2.0.0`, `v2` major tag and Marketplace checkbox are post-merge
  manual steps; profile repo `kiaquila/kiaquila` must move from `@v1` to
  `@v2` to pick the orbit up.
- Panel colours are constants in `orbit.ts`, not theme fields (dark-only).
