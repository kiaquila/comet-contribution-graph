# 009 — comet tail

## Intent

Replace the current shipped comet trail (4 staggered ghost circles with no
directional taper) with a visible, tapered, glowing tail that mirrors the
prototype design intent
(https://comet-contribution-graph.vercel.app) within SMIL-safe SVG constraints.

Additionally: shrink the comet head by ~15% — the current head reads as too
large relative to the other stars in the rendered output.

## Constraints

- SMIL only (no JS, no external CSS — GitHub camo strips both).
- Self-contained SVG served as `image/svg+xml` via `<img>` / `<picture>`.
- `prefers-reduced-motion` branch unchanged (static comet has no tail).
- No regression to adaptive star rendering (PR #11 / feature 008).
- Bundle growth vs. baseline: the single-ellipse tail actually reduces bundle
  by ~1 KB per SVG (replaces 4 ghost circles with 1 ellipse), so no growth
  budget concern.

## Design — winning variant: `ellipse-blurred`

Primary choice after side-by-side visual review of 6 variants × 4 accounts
(kiaquila / staks-sor / yeachan-heo / bcherny). See
[designer-memo.md](./designer-memo.md) for feasibility analysis.

### Tail

A single `<ellipse>` with:
- `cx="-rx" cy="0" rx="56" ry="3.0"` — leading edge (local x=0) lands on the
  motion point; body extends backwards along -tangent.
- `fill="url(#tail-grad)"` — horizontal `<linearGradient>` in local coords,
  stops tuned for a soft taper: transparent at the far tail, brightening
  toward the head, transparent at the exact leading edge so the head circle
  paints cleanly on top.
- `filter="url(#tail-blur)"` — `<feGaussianBlur stdDeviation="1.2"/>` softens
  the edges so the tail feathers rather than cuts.
- `<animateMotion ... rotate="auto" path="...">` — rotates the ellipse to
  follow the path tangent, so the gradient's head-to-tail direction tracks
  the direction of travel.
- Opacity animation: `1;1;0;0` over `keyTimes="0;travFrac;travFrac+0.001;1"` —
  visible during the traversal phase, invisible during hold (matches head).

### Head shrink (~15%)

Reduce the three head radii uniformly:

| constant | before | after |
|---|---|---|
| `COMET_NUCLEUS_R` | 2.20 | 1.85 |
| `COMET_COMA_INNER_R` | 5.50 | 4.70 |
| `COMET_COMA_OUTER_R` | 9.00 | 7.65 |

Opacities unchanged (0.55 / 0.28 / 1.0).

### Removed

- `COMET_TRAIL` constant + `TrailParticle` interface.
- The ghost-particle loop in `renderComet()`.
- `theme.cometTrail` is no longer referenced by the renderer but kept in the
  `Theme` interface for now (removal would be a breaking theme change — defer).

## Samples

- Datasets: `kiaquila`, `staks-sor`, `yeachan-heo`, `bcherny` — 4 benchmark
  accounts. bcherny fixture added in this PR (`tests/fixtures/bcherny.json`).
- Snapshots: `tests/__snapshots__/*.animated.svg` regenerated via
  `UPDATE_SNAPSHOTS=1 pnpm test`.
- Local-only prototype archive: `prototypes/v2-local/` (gitignored) holds the
  4 ellipse-blurred SVGs reviewed before the PR.

## Experimental scaffold (not shipped)

`experiments/comet-tail/` holds the 6-variant comparison driver used to pick
the winner. Gitignored. Keep locally for future renderer experiments; delete
when done.
