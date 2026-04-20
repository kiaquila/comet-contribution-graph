# Plan — Widget polish: cinematic starry sky

## Approach

Single-file change on `prototypes/variant-d-grid-peaks.html`. Two agents in sequence: `designer` crystallizes visual parameters (numbers, gradients, shape mix, jitter range, timing curve); `executor` applies the edits; `code-reviewer` does an a11y-focused pass before push.

## Why not /plan interview

Requirements are already concrete (user specified 4 items with clear intent). Strategic-planning interview would add friction. A spec + short design brief is enough.

## Design brief (input to `designer` subagent)

1. **Comet feel** — current: 8 s, `ease-in-out`, uniform stroke-gradient, white drop-shadow. Target: head reads as a bright point, tail fades to transparent; traversal feels fast (≤ 3 s), with a short "re-enter" pause before the loop restarts, not a continuous crawl. Decide: head element (separate `<circle>` riding the path vs. SVG `<motion>` vs. CSS offset-path), trail render (gradient along path vs. multiple stroke copies with offsets).
2. **Star size/colour ladder** — replace the discrete `count < 3 / < 6 / else` buckets with a continuous map `f(count) -> {r, colour, opacity}`. Peak stars must differentiate when counts differ (at least 3 radii + 2 yellows). Equal counts produce equal visuals. Decide: exact curves and endpoints.
3. **Shape mix** — at least 2 shape variants. Options: pure circle, 4-point cross spike (small `<line>` cross over circle), tiny 5-point star polygon. Decide: how many variants, how mix is chosen (e.g. rarer spikes only on peaks + top-N non-peaks). Must be deterministic via the existing seeded `rng()`.
4. **Jitter** — offset `(cx, cy)` by `rng() * 2 - 1` scaled to `± j * cellSize`. Decide: `j` (suggest 0.3–0.35 to keep 7-row week still legible). Must use the same seeded RNG so sky is reproducible.
5. **Reduced motion** — every new animation needs a `@media (prefers-reduced-motion: reduce)` freeze state.

## Implementation touchpoints (for `executor`)

- Replace `.comet-path` + single `<path>` with: base faded-path (unchanged) + animated head (`<circle>` following path via `animateMotion` or JS `setInterval`-free `Element.animate` on position) + trail rendered as gradient-opacity stroke.
- Refactor data-star loop: extract `starFor(d)` helper that returns `{r, fill, opacity, shape}` — single place where ladders live.
- Introduce `jitter(cellX, cellY)` using the seeded `rng()`; call once per star at data generation time so downstream path coordinates match.
- Top-level CSS variables for tunables (`--comet-duration`, `--comet-head-r`, `--jitter-amp`) so `designer` numbers are obvious in the file header.
- A11y: wrap SVG with `role="img"`, add `<title>Contribution activity over the last year</title>`, `<desc>`, `aria-label` on `.graph-wrapper`.

## Validation order

1. `designer` returns a design brief with concrete numbers + rationale.
2. `executor` applies edits in one pass.
3. Local `pnpm run preflight`.
4. Manual browser check (normal + reduced-motion emulation).
5. `code-reviewer` a11y-focused pass.
6. Commit → push → PR → `@codex review`.
7. Await `baseline-checks`, `guard`, `AI Review`, Vercel preview.

## Risks

- `animateMotion` support is fine in evergreens but needs verification for the head element; fallback: drive head with `Element.animate` on `cx`/`cy` computed from path samples.
- Trail-gradient along an arbitrary polyline is non-trivial; may need multi-stop `stroke-dasharray` trick or a masked linear gradient oriented along the path bbox. `designer` picks the cheapest approach.
- More shapes + spikes raise node count; keep total SVG children under ~600 to stay cheap.
- Increasing jitter amplitude risks overlapping stars in dense columns; clamp or use rejection sampling only if overlap is actually visible.

## Out of bounds

- No refactor of scripts, no new CI steps, no docs_comet changes beyond this spec folder.
