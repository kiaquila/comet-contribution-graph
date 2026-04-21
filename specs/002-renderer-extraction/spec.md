# Feature 002 — Renderer extraction: pure TS SVG builder

## Goal

Extract the sky-rendering logic from the single-file prototype `prototypes/variant-d-grid-peaks.html` into a pure TypeScript module (`src/renderer.ts`) that produces a valid SVG string from a flat contribution-day array. This module is the foundation of the upcoming GitHub Action (PR 004) and the reusable rendering kernel the Action entrypoint will call.

## Why

The prototype works only in a browser and embeds rendering, animation, and DOM wiring in one `<script>`. The GitHub Action must produce the same SVG server-side, in Node, without DOM access, with deterministic output for CI snapshots. Extracting the pure rendering path now — before GraphQL data wiring (PR 003) or Action packaging (PR 004) — lets us validate the visual output independently, via snapshot tests, against the prototype's existing five variant configs.

The prototype stays on Vercel preview as the visual source of truth during extraction: both artifacts must produce visually equivalent SVG for the same input.

## Scope

**In scope** (first of four PRs toward MVP Action)

- New TypeScript toolchain: `tsconfig.json`, `typescript` + `@types/node` devDependencies, `build:renderer` script compiling `src/**/*.ts` to `dist-renderer/**`.
- `src/renderer.ts` — pure function `renderCometSVG(data, options) -> string`. No DOM, no `requestAnimationFrame`, no `document`. Takes flat `ContributionDay[]` and returns a complete `<svg>...</svg>` string.
- `src/normalize.ts` — percentile bucketing and peak selection from real contribution counts (replaces the hardcoded `count < 3 / < 6` thresholds and mock `peakCountRange`).
- `src/themes.ts` — dark palette definitions (background, star fills, comet head/coma/trail, constellation, labels). Light theme intentionally dropped — a starry sky is by definition dark; supporting a light variant would break the product's visual metaphor. Decided 2026-04-20.
- `src/types.ts` — shared type definitions (`ContributionDay`, `RenderOptions`, `Theme`, `StarBucket`).
- SMIL animation migration: replace the prototype's `requestAnimationFrame` comet loop, CSS `@keyframes twinkle` / `halo-pulse` with equivalent `<animate>` / `<animateMotion>` elements embedded in the generated SVG. Tunable timings via `RenderOptions` (defaults from the designer decision log below).
- Two output modes per `animated: boolean` — one animated (default) and one static variant for `prefers-reduced-motion`. Only dark theme (see above).
- Deterministic PRNG port (`makePRNG` from prototype) into `src/prng.ts` or inlined in `renderer.ts`; seed input makes output reproducible.
- Unit tests:
  - `tests/renderer.test.mjs` — renders fixed fixture data, asserts SVG structure (`<svg>` root, expected element counts, presence/absence of `<animate>` per `animated` flag), snapshot compares the full string.
  - `tests/normalize.test.mjs` — percentile bucketing correctness on five fixture profiles (sparse/normal/heavy/empty/single-day).
- ESLint config extension to cover `src/**/*.ts` (current config lints only `prototypes/**/*.html`).

**Out of scope** (deferred to later PRs)

- GraphQL data fetching — PR 003.
- `action.yml`, `src/action.ts`, ncc bundle, output-branch push — PR 004.
- Repo dogfood workflow, README embed — PR 005.
- GIF output — post-MVP.
- Playground / landing page — post-MVP.
- Removal of the prototype or any changes to `prototypes/variant-d-grid-peaks.html` — prototype remains the browser showcase and is not modified in this PR.

## Constraints

- No runtime dependencies. `src/**` compiles and runs on Node 20 stdlib only. Test fixtures live in `tests/fixtures/*.json`.
- Deterministic output: the same `(data, options, seed)` tuple produces a byte-identical SVG string across runs.
- Font: system generic `monospace`. No CDN font, no base64-embedded font, no `<path>`-glyph conversion.
- Relative color normalization: star intensity is derived from each user's own distribution (percentile-based), never absolute thresholds. Empty year renders an empty sky with no comet.
- SVG must remain renderable as a static asset through GitHub's camo proxy in `<img>` context — no `<script>`, no external references. CSS animations allowed only inside `<style>` elements if necessary, but SMIL is preferred for the comet and pulses.
- Prototype (`prototypes/variant-d-grid-peaks.html`) MUST remain byte-identical in this PR. No regression of the Vercel preview.
- `pnpm run ci` stays green: `check:repo`, `check:html`, `check:js`, `build`, `format:check`, `test`. New TypeScript compile (`tsc --noEmit` at minimum) is added to the `ci` script.

## Validation

- **Unit tests**: `pnpm test` runs new renderer and normalize suites alongside existing tests; all green.
- **Snapshot discipline**: SVG snapshots checked into `tests/__snapshots__/`; any intentional visual change requires a snapshot update in the same commit.
- **Deterministic check**: calling `renderCometSVG` twice with identical inputs returns identical strings (asserted in unit test).
- **Prototype parity**: for at least one fixture profile matching a prototype variant config, side-by-side visual comparison — the TS-generated SVG and the prototype's client-generated DOM look visually equivalent (manual verification, reviewer does this locally).
- **Type check**: `pnpm run build:renderer` (or `tsc --noEmit`) passes with zero errors. Added to `ci` script.
- **Lint**: ESLint passes on `src/**/*.ts` with the same rule set spirit as HTML prototype (no `no-unused-vars` violations, no `console.log` leftover).
- **No prototype regression**: `prototypes/variant-d-grid-peaks.html` is byte-identical to `origin/main`; Vercel preview green.
- **CI gates**: `baseline-checks`, `guard`, `AI Review` all green on the PR head SHA.

## Acceptance

- `pnpm install` adds `typescript`, `@types/node`; lockfile updated.
- `pnpm run build:renderer` compiles cleanly.
- `pnpm test` runs ≥ 10 new test cases across renderer + normalize; all pass.
- A helper script `scripts/render-sample.mjs <fixture-name>` writes a sample SVG to `./sample-out/<fixture>.svg` for manual inspection — reviewer can open it in a browser.
- Rendering for the `empty-year` fixture produces valid SVG with stars only, no comet, no SMIL animation of the comet element.
- Rendering for `animated: false` produces an SVG with zero `<animate>` / `<animateMotion>` / `<animateTransform>` elements — the static `reduced-motion` variant.
- Prototype file unchanged (git diff shows only `src/**`, `tests/**`, `specs/002-renderer-extraction/**`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `scripts/render-sample.mjs`, and `eslint.config.*` touched).

## Fixed design decisions (from designer + user approval)

| Parameter                     | Value                                                                             | Source        |
| ----------------------------- | --------------------------------------------------------------------------------- | ------------- |
| Font                          | system `monospace`                                                                | user approval |
| Comet traversal duration      | 4800 ms                                                                           | designer rec  |
| Inter-cycle hold              | 3500 ms                                                                           | designer rec  |
| Background twinkle period     | 7 s                                                                               | designer rec  |
| Halo-pulse period             | 3 s                                                                               | designer rec  |
| Halo-pulse stagger per peak   | 0.6 s                                                                             | designer rec  |
| Top-K peaks (comet waypoints) | hardcoded 7, clamp `[2, 7]`                                                       | user approval |
| Empty year                    | stars-only sky, no comet                                                          | user approval |
| Output branch name            | `comet-graph` (used in PR 004, fixed now so reduced-motion docs can reference it) | user approval |

## Non-goals

- Comet trail "grow then shrink" dash animation via SMIL — deferred. MVP renders the full constellation path statically and animates only the comet head via `<animateMotion>`. Accepted trade-off for SMIL compatibility through camo.
- `prefers-reduced-motion` auto-detection inside a single SVG — not feasible through `<img>`. We emit a separate reduced-variant SVG; users who want it add a second `<source media="(prefers-reduced-motion: reduce)">` in their `<picture>` (documented in PR 005).
- Any test running a real browser against the generated SVG. Visual regression is string-snapshot-based. Browser smoke stays on the prototype (existing Playwright test).
