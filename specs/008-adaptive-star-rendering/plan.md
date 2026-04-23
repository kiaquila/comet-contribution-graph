# Plan — Adaptive star rendering

## Approach

Single PR on branch `claude/flamboyant-bouman-caf36e`. Risk surfaces:

- **(A) Normalize math change** — log-compression against `maxNonPeak` and the new `d` regime. Already architect-validated (see synthesis in session transcript). Implementation is mechanical.
- **(B) Renderer layer refactor** — halo+core with conditional PRNG stream changes. Deterministic seed reproducibility is at risk; must preserve `seed=42` stable output for the new formulas (not for the old — snapshots regenerate fully).
- **(C) Visual verdict on three real accounts** — the whole point of the feature. Standalone SVG samples committed for user review before merge.

Handle (A) + (B) as one executor pass. Handle (C) via committed `samples/*.svg` + user eyeball.

## OMC pipeline

1. **Already done (pre-spec)**: architect + designer in parallel → synthesis → user approval (2026-04-23). No more strategy loops needed.
2. **executor** — surgical edits to `src/types.ts`, `src/normalize.ts`, `src/renderer.ts`, `package.json`; add fixtures + invariant tests; regenerate snapshots; emit 3 sample SVGs.
3. **code-reviewer** — verify invariants are tested by actual assertions (not checkbox self-reports; memory `feedback_subagent_checkbox_trust`). Check monotonicity, floor clamps, and PRNG stream stability.
4. **user eyeball** — open 3 sample SVGs in browser, compare against regime descriptions in spec.
5. **codex review** — `gh pr comment <N> -b '@codex review'` after push (memory `feedback_codex_human_trigger`).

## Key implementation decisions (locked)

**Density regime `d`** (new, computed in `normalize.ts`):

```
mean     = sum(activeCounts) / activeCount
variance = sum((c - mean)^2) / activeCount
stddev   = sqrt(variance)
cv       = activeCount > 0 ? stddev / mean : 0
rawCov   = activeCount / totalDays
cvTerm   = min(cv / 4, 1)
d        = clamp(0.6 * rawCov + 0.4 * cvTerm, 0.05, 1.0)
```

Exposed via `Normalization.densityRegime`. `renderer.ts` consumes it directly (replaces the current `activeDays / 365` computation).

**Non-peak intensity** (replaces `count / maxActive`):

```
intensity = maxNonPeak > 0 ? log(1 + count) / log(1 + maxNonPeak) : 0
```

`maxNonPeak` = max count among active days that are NOT in the peak set. Exposed via `Normalization.maxNonPeak` (new field) so the renderer can also read it if needed.

**Halo+core geometry** (replaces `nonPeakRadius` / `nonPeakOpacity` / spike-arms):

```
t = intensity
d = densityRegime

coreR   = max(0.8, (0.7 + 1.1*t) * lerp(1.0, 0.85, d))   // floor 0.8, cap 2.2
coreOp  = max(0.5, lerp(0.55, 0.38, d) + t * lerp(0.38, 0.28, d))
haloR   = max(1.5, (1.8 + 2.8*t) * lerp(1.0, 0.82, d))   // always present
haloOp  = lerp(0.12, 0.08, d) + t * lerp(0.32, 0.22, d)
```

Fills: `hsl(hue, lerp(50,82,t)%, lerp(38,88,t)%)` for core, `hsl(hue, lerp(30,55,t)%, lerp(40,70,t)%)` for halo. Hue = `dataStarHue` (214) for t<0.7; for t≥0.7 shift `hue = 214 - (t-0.7)/0.3 * 14` toward 200 (warmer blue-cyan on brightest non-peaks; never leaves blue family).

**Jitter (5-bucket)**:

```
CORNER_OFFSET_PX = 4.0
CORNER_DITHER_PX = 1.2
weights = [0.22, 0.22, 0.22, 0.22, 0.12]  // TL, TR, BL, BR, center
```

Bucket selection: one `rng()` call, cumulative-weight lookup. Then two more `rng()` calls for ±dither. Retain PRNG parity with the prior stream by maintaining a 3-call budget per star (old: 1 aesthetic + 2 jitter = 3; new: 1 bucket + 2 dither = 3). No anti-collision rule in v1.2 — adds complexity for marginal visual gain; revisit if reviewers flag clustering.

**Background stars scaling**:

```
bgCount = d < 0.15 ? 50 : d < 0.45 ? 65 : 80
bgOpacityBase = d < 0.15 ? 0.12 : d < 0.45 ? 0.15 : 0.18
```

**Spike arms removal**: `renderStar` returns ONLY halo + core. No branching on `d.shape`. Remove the `StarShape` type's `"spike"` variant usage for non-peaks; peaks still compute angle but the non-peak branch of `layout` no longer consumes PRNG calls for shape/angle logic — this changes the stream. **Mitigation**: keep `StarShape` type in place, always set `shape = "circle"` for non-peaks, and preserve the same PRNG call count by retaining the 3-call pattern above.

## File-level plan

- `src/types.ts` — extend `Normalization` with `{ maxNonPeak, meanActive, cvActive, densityRegime }`. Keep existing fields.
- `src/normalize.ts` — compute new fields; replace intensity formula for non-peaks. Peak logic untouched.
- `src/renderer.ts` — new constants (`CORNER_OFFSET_PX`, `CORNER_DITHER_PX`, `BUCKET_WEIGHTS`); replace `nonPeakRadius` + `nonPeakOpacity` + `renderStar` with halo+core; refactor `layout` to the 5-bucket placement; scale `renderBgStars` by `d`. Remove spike-arm emission in non-peak path.
- `src/themes.ts` — no change (hue reused).
- `package.json` — `version: "1.2.0"`.
- `tests/fixtures/{kiaquila,staks-sor,yeachan-heo}.json` — copy from `sample-out/contributions-*.json`.
- `tests/adaptive-invariants.test.mjs` — six invariants.
- `tests/renderer.test.mjs` — extend FIXTURES list with 3 new names (auto-snapshots). Existing fixtures regenerate due to algorithm change — expected.
- `tests/__snapshots__/*.svg` — regenerate via `UPDATE_SNAPSHOTS=1 pnpm run test`.
- `specs/008-adaptive-star-rendering/samples/{kiaquila,staks-sor,yeachan-heo}.svg` — emit via a tiny `scripts/render-008-samples.mjs` run once; committed.

## Rollout

No feature flag. Renderer change is self-contained; no API surface change. Action consumers auto-pick up the new output on next `v1` tag move. Bootstrap ships v1.2.0 via post-merge tag dance (same as 007 pattern).
