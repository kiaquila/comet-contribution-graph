# Feature 001 — Widget polish: cinematic starry sky

## Goal

Elevate the variant-d prototype so the contribution graph reads as a real night-sky constellation rather than a grid demo: a fast, bright-headed comet with a fading trail; varied star sizes and shapes that respond to activity volume; natural jitter inside each grid cell so every contributor's sky is visually unique.

## Why

Current prototype (`prototypes/variant-d-grid-peaks.html`) meets structural requirements but still reads as a "data grid with decorations":

- Comet animates for 8 s with `ease-in-out` — feels like a snake crawling along a rail, not a comet streaking through the sky.
- Comet trail is a simple white stroke with uniform glow; there is no bright point-like head and no transparency gradient down the tail.
- Peak stars all share one size (`r=3.5`) and one color (`#ffd97a`); background data stars have only 3 discrete buckets.
- Every star is pinned to the cell center, producing a perceptibly regular grid.
- Accessibility is partial: `prefers-reduced-motion` is honoured for the comet and twinkle/pulse, but SVG lacks semantic labelling (no role, title, desc) and text-contrast of the header copy on the dark background hasn't been audited.

All four problems are solved inside the single prototype file — no build pipeline, data wiring, or Action packaging changes.

## Scope

**In scope** (prototype-only)

- Comet animation: ≤ 3 s per traversal, `ease-out` or `cubic-bezier` feel, bright circular head + gradient fading trail, configurable head/tail params in one place.
- Data-star size + colour variation: continuous mapping from `count` to radius and yellow-shade (peaks) / blue-shade (non-peaks). Equal-count days render identical stars (no artificial tie-breaking).
- Star shape variation: at least 2 shape variants (circle + 4/5-point cross spike) mixed deterministically from the seeded PRNG so the layout is reproducible per seed.
- Per-cell jitter: each star's (cx, cy) offset ≤ ±35 % of `cellSize` from cell center, deterministic via the seeded PRNG.
- A11y: SVG `role="img"`, `<title>` + `<desc>`, `aria-label` on the wrapper, month labels reachable to screen readers, verify WCAG AA contrast on `.header h1/p` vs background gradient; keep `prefers-reduced-motion` honoured for comet, twinkle, pulse, and any new animations.

**Out of scope** (follow-up PRs)

- Replacing prototype with a product `index.html`.
- Real GitHub GraphQL data wiring.
- Node-compatible SVG generator for the Action.
- Multiple prototype variants / theming.
- Interactive tooltips or click-through.

## Constraints

- Single file: only `prototypes/variant-d-grid-peaks.html` is edited.
- No new external dependencies; Google Fonts CDN remains the only external resource.
- Deterministic output for a given `seed` value (sky must be identical across reloads with the same seed).
- `pnpm run preflight` must stay green: feature-memory gate, baseline, html-validate, build, format, tests.

## Validation

- Manual: open file in browser; comet clearly reads as head-first streak, not uniform stroke; no two peak stars look identical unless counts match; sky has no visible grid when zoomed out.
- `pnpm run preflight` green locally.
- `prefers-reduced-motion: reduce` audit: emulated in DevTools, confirm comet, twinkle, pulse all static.
- a11y: axe/Lighthouse scan of the prototype reports no critical issues; header copy passes WCAG AA.
- CI: `baseline-checks`, `guard`, `AI Review`, Vercel preview green.

## Acceptance

- Comet traversal ≤ 3 s, head radius ≥ 2× trail start width, trail opacity fades to ≤ 10 % at tail end.
- Peak-star radius spans at least 3 distinct values when counts differ; ≥ 2 yellow shades for peak stars (bright peak = brightest).
- Non-peak data-star radius + colour vary continuously with `count` (remove the current hard 3/6 thresholds or replace with finer mapping).
- Every rendered star has a jittered position inside its cell; no star sits exactly at cell center (except when jitter RNG returns 0).
- SVG exposes `role="img"`, `<title>`, `<desc>`; wrapper has `aria-label`.
- Reduced-motion audit clean; no new infinite CSS/JS animations without `@media (prefers-reduced-motion: reduce)` fallback.
