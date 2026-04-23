# Tasks — Adaptive star rendering

## Pre-flight

- [x] Fetch real contribution data for kiaquila / Staks-sor / Yeachan-Heo → `sample-out/contributions-*.json`, `sample-out/distribution-stats.json`
- [x] Architect + designer synthesis → user approval

## Implementation

### Types + normalize

- [ ] `src/types.ts` — add `maxNonPeak: number`, `meanActive: number`, `cvActive: number`, `densityRegime: number` to `Normalization`
- [ ] `src/normalize.ts` — compute `mean`, `variance`, `cv` over active counts
- [ ] `src/normalize.ts` — compute `maxNonPeak` = max of non-peak active counts
- [ ] `src/normalize.ts` — compute `d = clamp(0.6 * (active/total) + 0.4 * min(cv/4, 1), 0.05, 1)`
- [ ] `src/normalize.ts` — replace non-peak `intensity` with `log(1+count) / log(1+maxNonPeak)` (fallback 0 when `maxNonPeak === 0`)
- [ ] `src/normalize.ts` — expose new fields in return value
- [ ] keep peak selection + `peakIntensity` formula unchanged

### Renderer

- [ ] `src/renderer.ts` — add constants `CORNER_OFFSET_PX=4.0`, `CORNER_DITHER_PX=1.2`, `BUCKET_WEIGHTS=[0.22,0.22,0.22,0.22,0.12]`
- [ ] `src/renderer.ts` — replace `layout()` body with 5-bucket selection + dither; preserve 3-calls-per-star PRNG budget
- [ ] `src/renderer.ts` — replace `nonPeakRadius`/`nonPeakFill`/`nonPeakOpacity` with 4 formulas: `coreR`, `coreOp`, `haloR`, `haloOp`
- [ ] `src/renderer.ts` — add `haloFill(t, hue)` helper: `hsl(hue, lerp(30,55,t)%, lerp(40,70,t)%)`
- [ ] `src/renderer.ts` — add `coreFill(t, hue)` helper: `hsl(hueAdj, lerp(50,82,t)%, lerp(38,88,t)%)` where `hueAdj = t >= 0.7 ? hue - (t-0.7)/0.3 * 14 : hue`
- [ ] `src/renderer.ts` — rewrite `renderStar()`: always emit halo `<circle>` first, then core `<circle>`; no spike arms
- [ ] `src/renderer.ts` — replace `densityFactor = activeDays/365` with `densityRegime` from normalize
- [ ] `src/renderer.ts` — `renderBgStars`: scale `BG_STAR_COUNT` and opacity by `d` (50 / 65 / 80; 0.12 / 0.15 / 0.18)
- [ ] `src/renderer.ts` — purge references to `aboveMedian` rendering gate (already removed in 007, verify)

### Fixtures + tests

- [ ] Copy `sample-out/contributions-kiaquila.json` → `tests/fixtures/kiaquila.json`
- [ ] Copy `sample-out/contributions-Staks-sor.json` → `tests/fixtures/staks-sor.json`
- [ ] Copy `sample-out/contributions-Yeachan-Heo.json` → `tests/fixtures/yeachan-heo.json`
- [ ] `tests/renderer.test.mjs` — append 3 new names to `FIXTURES` array
- [ ] `tests/adaptive-invariants.test.mjs` (new file) — six invariant assertions against normalize output for the 3 real fixtures
- [ ] Adjust `tests/normalize.test.mjs` if intensity-range assertion (line 65–76) needs the new `maxNonPeak > 0` branch
- [ ] `UPDATE_SNAPSHOTS=1 pnpm run test` — regenerate all SVG snapshots
- [ ] Eyeball diff all regenerated snapshots (sparse/normal/heavy + 3 real) — confirm visual intent matches spec regimes

### Sample outputs for user review

- [ ] `scripts/render-008-samples.mjs` — one-off script: load the 3 fixtures, render animated SVGs, write to `specs/008-adaptive-star-rendering/samples/*.svg`
- [ ] Run script, commit 3 SVGs

### Version + docs

- [ ] `package.json` — `1.1.0` → `1.2.0`
- [ ] No README change in this PR (theme/config changes come later; v1.2.0 is a rendering refinement)

## CI + PR

- [ ] `node scripts/check-feature-memory.mjs origin/main HEAD` — passes
- [ ] `pnpm run ci` — all green
- [ ] code-reviewer agent — confirm invariants are tested from code, not from self-report
- [ ] `git push`
- [ ] `gh pr create --base main --head claude/flamboyant-bouman-caf36e`
- [ ] `gh pr comment <N> -b '@codex review'` — trigger AI Review
- [ ] Monitor `baseline-checks`, `guard`, `AI Review` — wait for ALL `COMPLETED` + `SUCCESS` before merge

## Post-merge (separate thread, not this PR)

- [ ] Tag `v1.2.0`, move `v1` tag, publish GitHub Release
- [ ] Wait 1 cycle (10 min) for bootstrap workflow on `kiaquila/kiaquila` profile, visual-check rendered graph
