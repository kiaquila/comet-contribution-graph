# Spec: 038 — orbit layout

## Goal

Ship the "Orbit" design (picked by the owner from a 20-variant cinematic
exploration on 2026-09-17) as the default renderer output, while keeping the
classic 7×53 grid available through a new `layout` Action input.

## Scope

In scope:

- `src/orbit.ts` — new radial layout: the year wound into 7 rings around a
  "sun" carrying the total, month ticks, a continuously orbiting comet, and a
  stats panel (username, date range, active days, longest streak, best day,
  busiest weekday, weekly-volume histogram with month labels).
- `src/glyphs.ts` — attribute helpers, golden peak star, comet stack and SVG
  `<defs>` extracted from `src/renderer.ts` so both layouts share them.
- `src/renderer.ts` — grid code unchanged in output; `renderCometSVG` now
  dispatches on `options.layout` (default `"orbit"`).
- `src/types.ts` — `Layout` type; `RenderOptions.layout`, `RenderOptions.username`.
- `src/action.ts`, `action.yml` — `layout` input (`orbit` | `grid`), validated
  before any network call; `username` is passed to the renderer for the panel
  title.
- Tests: grid snapshots kept byte-for-byte as `<fixture>.grid.<variant>.svg`,
  orbit snapshots take over the historical labels, `bcherny` fixture added to
  the snapshot set, orbit-specific assertions, Action input validation.
- Docs: README (inputs, concept), `docs_comet/project-idea.md`,
  `docs_comet/project/devops/github-action-target.md` fixed decisions.
- `package.json` version `2.0.0` — default output changes shape (896×300 vs
  896×150), so this is a breaking visual change for existing embeds.

Out of scope:

- Releasing/tagging `v2` and moving the Marketplace listing (post-merge).
- Removing the grid layout or its snapshots.
- Committing the 20-variant gallery generator (`prototypes/cinematic-variants/`,
  gitignored local scaffold, same treatment as `experiments/` in 009).
- Light theme, extra inputs (`top_n`), GIF output.

## User Stories

### User Story 1

As a profile-README owner, I want the comet graph to read as a poster — a
radial year with my headline numbers next to it — so that visitors grasp my
activity in two seconds and remember the visual.

### User Story 2

As an existing user of `@v1`, I want to keep the classic grid by setting
`layout: grid`, so that upgrading the Action does not force a redesign of my
README.

## Acceptance Criteria

1. Given no `layout` input, when the Action runs, then `comet.svg` (and
   `comet-reduced.svg`) are 896×300 orbit renders whose panel title is the
   `username` input in upper case.
2. Given `layout: grid`, when the Action runs, then the output is byte-identical
   to the pre-change renderer for the same data and seed.
3. Given `animated: false`, when the orbit renders, then the SVG contains no
   `<animate`/`<animateMotion` elements.
4. Given an empty year, when the orbit renders, then the sun shows `0`, the
   stats show `0` / `0d` / `—` / `—`, and no comet is emitted.
5. Given the four benchmark accounts (kiaquila, staks-sor, yeachan-heo,
   bcherny), when rendered, then every active day is placed on its ring, peaks
   are golden stars, and month labels do not overlap the panel.

## Negative Scenarios

1. Given `layout: spiral`, when the Action runs, then it fails with a message
   naming `layout` and the allowed values, before any GraphQL fetch.
2. Given days with unparsable dates, when stats are computed, then the day is
   still counted in totals/streaks and skipped only for month/weekday grouping
   (no `NaN` in the output).

## Requirements

- FR-001: `renderCometSVG(days, { layout })` with `layout ∈ {"orbit","grid"}`,
  default `"orbit"`.
- FR-002: Orbit output is deterministic for a given `(days, seed, username)`.
- FR-003: Orbit uses only SMIL, system `monospace`, no external resources.
- FR-004: Stats are derived from the same `days` array the renderer receives;
  `activeDays` comes from `normalize()` so both layouts agree on it.
- FR-005: Numbers are grouped with `,` thousands separators without relying on
  ICU locale data.

## Success Criteria

- SC-001: `pnpm run ci` green; 140+ tests pass; 36 snapshot files.
- SC-002: Grid snapshots unchanged vs `main` (verified by byte comparison
  before regeneration).
- SC-003: Orbit SVG ≤ 45 KB animated for the sparse benchmark.

## Assumptions

- The owner accepts a `2.0.0` major bump and will move the profile repo to
  the new tag after release.
- The 10° gap at the top of the ring is the year start/end marker; no
  additional "today" cursor is needed for v2.0.0.
