# Feature 008 — Adaptive star rendering (halo + core, log-intensity, distribution-aware regime)

## Goal

Make non-peak stars expressive across the full distribution of a GitHub year, not just peaks. Every active day must render with a visual weight proportional to that day's significance *within the author's own distribution*, using a halo-plus-core layered star and a density regime derived from distribution shape (coverage + tail-heaviness), not just active-day count. Ship as v1.2.

## Why

v1.1 shipped (2026-04-23) and the widget rendered all non-peak days, but the mid-distribution collapsed: because `intensity = count / maxActive` divides by the all-active max (which includes peak outliers), a heavy-tailed author like Yeachan-Heo (max=542, median=54) produces mid-tier days that map to intensity ~0.09 — visually indistinguishable from a count=1 day. User quote:

> "все еще граф не показателен вне пиковых значений"
> "на маленьких аккаунтах все контрибы на звездном небе видны, на средних все или почти все, на крупных аккаунтах отбрасывается кака-то несущественная по остальным меркам часть в целях нормализации, но крупный аккаунт все еще будет демонстрировать более яркое и насыщенное звездами небо"

Three benchmark accounts were designated by the user for before/after comparison: [kiaquila](https://github.com/kiaquila) (small, 27/369 active days), [Staks-sor](https://github.com/Staks-sor) (medium, 67/369), [Yeachan-Heo](https://github.com/Yeachan-Heo) (large, 115/369, max=542). None of the three exceeds the user's mental "⅓ of year" normalization threshold — the practical shift from sparse-flat to dense-heavy-tailed happens earlier, around coverage ~25–30% *combined* with high CV.

## Scope

**In scope**

1. `src/normalize.ts` — compute and expose `maxNonPeak`, `meanActive`, `cvActive`, `densityRegime` (the new `d ∈ [0.05, 1]`). Replace non-peak `intensity` formula with log-compression against `maxNonPeak`. Keep peak selection logic unchanged.
2. `src/types.ts` — extend `Normalization` interface with the new fields; `NormalizedDay.intensity` continues to be `[0,1]` for non-peaks but now via log.
3. `src/renderer.ts` — replace the single-circle non-peak with a 2-layer halo+core render. Remove spike-arms from non-peaks (halo supplants them). Retire `JITTER_AMP=0.32` and replace with a 5-bucket corner+center placement system (`CORNER_OFFSET_PX=4.0`, `CORNER_DITHER_PX=1.2`, weights 0.22×4 + 0.12 center). Scale `BG_STAR_COUNT` by density regime (50 → 65 → 80).
4. `src/themes.ts` — no new keys needed (hue reuse); confirm `dataStarHue` is threaded through halo + core.
5. `tests/fixtures/` — add three new real-data fixtures: `kiaquila.json`, `staks-sor.json`, `yeachan-heo.json` copied from `sample-out/`.
6. `tests/adaptive-invariants.test.mjs` — six invariant assertions on the three real fixtures (see Validation).
7. `tests/__snapshots__/` — regenerate all snapshots (expected drift — all non-peak rendering changes).
8. `specs/008-adaptive-star-rendering/samples/` — commit three standalone SVG previews (one per reference account, animated) so the PR reviewer can visually check the three regimes without running fixtures.
9. `package.json` — version bump `1.1.0` → `1.2.0`.

**Out of scope**

- Peak-selection changes.
- Comet path / peak styling.
- New filters or animations (new non-peak stars are static; `prefers-reduced-motion` surface area does not grow).
- Light-theme addition.
- Any data-layer change.

## Constraints

- Every active day must render with `coreRadius ≥ 0.8` and `coreOpacity ≥ 0.5` — nothing invisible.
- Monotonicity: `max(coreRadius)` across users is ordered small ≤ medium ≤ large. The ceiling grows with `d`.
- Relative normalization invariant preserved (memory `project_relative_normalization_rule`) — no absolute count thresholds.
- Bundle-size hygiene: halo+core is 2 primitives per non-peak; spike removal saves ~432 primitives on the largest reference account.
- Halo primitives use plain fill opacity (no filter) — Gaussian blur is only reserved for the existing peak `organic-sphere` filter.
- PRNG stream stability: jitter refactor must keep `seed=42` reproducible; new PRNG consumption pattern is documented in the renderer.
- Theme-agnostic: all colors derive from `theme.dataStarHue`; no new hue constants baked in.
- Feature-memory guard: `specs/008-adaptive-star-rendering/{spec,plan,tasks}.md` must exist before push (memory `feedback_guard_requires_specs_for_chores`).
- Commit convention: subject-only, conventional prefix (CLAUDE.md).

## Validation

**Six invariants tested programmatically against `kiaquila`, `staks-sor`, `yeachan-heo` fixtures:**

1. kiaquila — all 27 active days have `coreRadius ≥ 0.8` AND `coreOpacity ≥ 0.5` (nothing invisible on small accounts).
2. kiaquila — `coreRadius(max-count-non-peak) / coreRadius(count=1) ≥ 1.3` (spread preserved on small accounts). Threshold calibrated during implementation: log-compression against a small `maxNonPeak` (≈9 for kiaquila) lifts count=1 intensity to ~0.3, so raw coreR ratio is modest; 1.3 is the minimum that still reads as visually distinct at 16px cell scale. Perceived differentiation is larger once opacity + halo scaling compound.
3. staks-sor — ≥95% of non-peak active days have `coreOpacity ≥ 0.55` (medium accounts sit above the floor, not on it).
4. yeachan-heo — ≥85% of non-peak active days have `coreRadius ≥ 0.85` (heavy tail does not vanish).
5. Cross-account monotonicity: `max(coreRadius) kiaquila ≤ staks-sor ≤ yeachan-heo`.
6. Halo presence: every active non-peak day emits a halo (100% coverage, enforced by the "halo always" product decision).

**Visual review (manual, blocking merge):**
- `specs/008-adaptive-star-rendering/samples/{kiaquila,staks-sor,yeachan-heo}.svg` — three standalone files the user opens in a browser. Each must match the regime description in the synthesis (sparse/precious, legible hierarchy, dense luminous cloud).

**CI (gates):**
- `pnpm run ci` green locally before every push.
- `node scripts/check-feature-memory.mjs origin/main HEAD` passes.
- After PR open: `@codex review` trigger, `baseline-checks`, `guard`, `AI Review` all SUCCESS.

**Numerical sanity table (expected values, rounded):**

| user | d | maxNonPeak | intensity(count=1) | intensity(max) | coreR(count=1) | coreR(max) |
|---|---|---|---|---|---|---|
| kiaquila | 0.13 | ~17 | 0.24 | 1.0 | ~0.89 | ~1.88 |
| staks-sor | 0.20 | ~30 | 0.20 | 1.0 | ~0.87 | ~1.92 |
| yeachan-heo | 0.31 | ~160 | 0.14 | 1.0 | ~0.82 | ~1.98 |
