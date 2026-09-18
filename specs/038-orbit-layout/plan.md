# Plan: 038 — orbit layout

## Summary

Port `v06 Orbit` from the local cinematic-variants gallery into the pure-TS
renderer as a second layout, sharing peak/comet glyphs with the grid, and expose
it through a validated `layout` Action input that defaults to `orbit`.

## Technical Context

- runtime: Node 24, TypeScript strict, SMIL-only SVG, no DOM.
- dependencies: none added.
- product paths: `src/{orbit,glyphs,renderer,types,action}.ts`, `action.yml`,
  `tests/`, `README.md`, `docs_comet/`, `package.json`, `.gitignore`.
- data changes: none (same `ContributionDay[]` input).

## Scope Boundaries

- in scope: layout switch, orbit renderer, shared glyph module, tests, docs,
  version bump.
- out of scope: release/tag/Marketplace, profile-repo workflow change, removing
  grid, theming the panel colours.

## Constitution Check

- Spec-first: this folder precedes the code on the branch.
- Testable boundaries: renderer is a pure function; snapshots + assertions.
- PR-only: `feature/038-orbit-layout` → `main` via PR.
- Simplicity: glyph extraction only for code that now has two real consumers
  (peak star, comet stack, defs, `attrs`, `lerp`, `coreFill`). Grid-only
  helpers stay in `renderer.ts`.
- Deployability: `pnpm run build:action` regenerates `dist-action/`; the
  Action contract gains one optional input.

## Complexity Tracking

- `src/glyphs.ts` is the one new module boundary. `renderCometStack` takes a
  `CometMotion` record because the grid comet pauses/fades each cycle while the
  orbit comet loops without a fade — the only behavioural fork between layouts.
- Stats (`computeStats`) live in `orbit.ts` because the orbit panel is their
  only consumer.

## Verification

| Acceptance criterion | Evidence                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------- |
| AC-001               | `tests/renderer.test.mjs` "layout defaults to orbit"; orbit snapshots carry `>KIAQUILA<`    |
| AC-002               | Byte comparison of `layout: "grid"` output vs pre-change snapshots: 0 mismatches / 16 files |
| AC-003               | `tests/renderer.smoke.test.mjs` "animated=false emits zero SMIL"; `*.reduced.svg` snapshots |
| AC-004               | `tests/renderer.test.mjs` "orbit: empty year renders zero stats and no comet"               |
| AC-005               | Visual review of `sample-out/*.orbit.*.svg` in Chrome at 896 px (4 accounts + edge cases)   |

Negative scenario evidence:

- `tests/action.test.mjs` "unknown INPUT_LAYOUT → setFailed, no fetch issued".
- `computeStats` skips `parseDate` failures for grouping only; `grep NaN` on
  all snapshots is empty.

## Risks

- Existing embeds change height 150 → 300 px on upgrade: mitigated by the
  `2.0.0` major bump and `layout: grid` opt-out.
- 110 twinkling background stars + 4 comet animations + 7 peak pulses: same
  order of SMIL elements as the grid (80 stars + 4 + 7), no new filters.
- `font-weight="bold"` on the sun total renders with the platform monospace
  bold face; acceptable (fixed decision: system monospace).
