# Design Brief v4 — Diffraction Spike Stars + Faster Comet

Iteration on v3 (`prototypes/variant-d-grid-peaks.html`). Addresses user verdict: peak stars
read as «круг налепили на звезду» (circle pasted onto a star). Fixes: comet speed ×2,
natural diffraction-spike rendering for all peak stars, subtle hue tints on background dust.

No layout changes. 5-variant stacked page stays identical.

---

## 1. Comet Speed Delta

| Variable               | v3 value                              | v4 value       | Why                                                                                                                                                                                                       |
| ---------------------- | ------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DURATION` (JS const)  | 1050 ms                               | **480 ms**     | ×2.2 faster; feels like a streak, not a glide                                                                                                                                                             |
| `HOLD` (JS const)      | 900 ms                                | **1350 ms**    | Longer pause compensates — total cycle 1830 ms stays sane                                                                                                                                                 |
| `TAIL_LEN` (JS const)  | 100 px                                | **100 px**     | Unchanged: at 480 ms the 100 px tail is proportionally shorter on screen, reads as a tight streak rather than a comet slug. Shortening further to 80 px is optional if it looks too long in testing.      |
| CSS `--comet-duration` | 1.05s                                 | **0.48s**      | Mirror of JS constant (informational; not currently consumed by CSS animation)                                                                                                                            |
| CSS `--comet-hold`     | 0.9s                                  | **1.35s**      | Mirror of JS constant                                                                                                                                                                                     |
| Easing                 | ease-in-out (current `ease()` approx) | **Keep as-is** | The existing `ease()` (ease-in-out approximation) works fine at 480 ms — the initial acceleration reads as a launch, the micro-deceleration at the final peak reads as arrival. Do not flatten to linear. |

**Total cycle:** 480 + 1350 = **1830 ms**. The longer hold prevents the animation feeling manic
(no rapid re-fire). At 1830 ms the comet completes ~33 cycles/minute, which feels alive without
becoming distracting.

---

## 2. Peak Star Redesign — THE BIG ASK

### Problem statement

v3 renders peaks as: solid `<circle r="3.6–5.0">` + 2 `<line>` arms with `armLen = r * 1.6`
(half-length 5.76–8.0 px). The circle carries all the visual weight; the arms are too short to
read as spikes. Result: a circle with a cross glued on top.

### Solution: hot-pixel core + soft halo + dominant spikes

The visual weight shifts from the solid circle to the halo bloom and the spike rays.
The circle becomes a 1 px hot pixel — the literal "point source" of the star.

#### a) Core circle — MUCH smaller

```
coreR = 0.9 + (count - 15) * 0.12
```

| count               | v3 r    | v4 coreR    |
| ------------------- | ------- | ----------- |
| 15                  | 3.60 px | **0.90 px** |
| 17                  | 4.30 px | **1.14 px** |
| 19                  | 5.00 px | **1.38 px** |
| 30 (Variant B hero) | ~8.5 px | **2.70 px** |

Fill: unchanged — `hsl(48, 100%, lerp(68%, 86%, (count-15)/4))` for counts 15–19.
For counts above 19 (Variant B, hero): clamp lightness at 92% (`hsl(48, 100%, 92%)`), nearly white-hot.
This core is rendered **last** (on top of halo and rays) so it reads as the brightest point.

#### b) Halo — soft glow circle replacing the old solid circle

Separate `<circle class="peak-halo">` rendered **first** (behind everything).

```
haloR = 3.5 + (count - 15) * 0.6
```

| count     | haloR    |
| --------- | -------- |
| 15        | 3.50 px  |
| 17        | 4.70 px  |
| 19        | 5.90 px  |
| 30 (hero) | 12.50 px |

Fill: same gold hue as core but at lower opacity — `hsla(48, 100%, 74%, 0.35)`.
Apply an SVG `<filter>` with `feGaussianBlur`:

```html
<defs>
  <!-- Reusable per-intensity blur filters; define once in the SVG -->
  <filter id="halo-sm" x="-150%" y="-150%" width="400%" height="400%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" />
  </filter>
  <filter id="halo-md" x="-150%" y="-150%" width="400%" height="400%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
  </filter>
  <filter id="halo-lg" x="-200%" y="-200%" width="500%" height="500%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5.0" />
  </filter>
</defs>
```

Filter selection by count:

- count 15–17: `filter="url(#halo-sm)"` (stdDeviation 2.2)
- count 18–19: `filter="url(#halo-md)"` (stdDeviation 3.5)
- count ≥ 20 (hero): `filter="url(#halo-lg)"` (stdDeviation 5.0)

The blur extends the halo radius visually well beyond `haloR` — the rendered glow diameter
is `haloR + ~3× stdDeviation`. At count=15: 3.5 + 6.6 ≈ 10 px total bloom radius. This
replaces the visual mass of the old 3.6 px solid circle with a luminous cloud instead.

Remove the CSS `drop-shadow` filter from peak stars. The SVG filter on the halo handles glow.
Keep the CSS `@keyframes pulse` but change what it animates: pulse the halo's `fill-opacity`
between 0.25 and 0.45 instead of `drop-shadow` on the whole group.

#### c) Primary diffraction spikes — DOMINANT feature

```
rayLen = 5.0 + (count - 15) * 1.0   // half-length, px
```

| count     | v3 armLen (half) | v4 rayLen (half) | total ray |
| --------- | ---------------- | ---------------- | --------- |
| 15        | 5.76 px          | **5.0 px**       | 10 px     |
| 17        | 6.88 px          | **7.0 px**       | 14 px     |
| 19        | 8.00 px          | **9.0 px**       | 18 px     |
| 30 (hero) | ~13.6 px         | **20.0 px**      | 40 px     |

Note: v4 ray at count=15 is slightly shorter in absolute terms (5.0 vs 5.76) but reads
dramatically longer because the core is now 0.9 px not 3.6 px. The ratio `rayLen / coreR`
goes from 1.6 to **5.6** — the spikes now visually dominate the core as they should.

Stroke: `stroke-width="0.5"`, `stroke-opacity="1.0"`, color = same gold as core fill.
Stroke-linecap: `round` (softens tip, avoids harsh pixel termination on thin lines).

#### d) Secondary diagonal spikes — 8-point diffraction

```
diagLen = rayLen * 0.45   // half-length
diagOpacity = 0.42
diagStrokeWidth = 0.4
```

4 additional lines at 45°/135°/225°/315° (implemented as 2 lines in the rotated `<g>`,
offset by 45° relative to the primary H+V group). The `rotate()` on the outer `<g>` already
handles the ±45° random tilt per star — the diagonals are rendered at a fixed 45° offset
within the group, so they rotate with the star consistently.

#### e) Rendering order — explicit

Within the star's `<g transform="rotate(angle, cx, cy)">`:

```html
<g transform="rotate(ANGLE, CX, CY)">
  <!-- 1. Halo — rendered first, blurred, behind everything -->
  <circle
    class="peak-halo"
    cx="CX"
    cy="CY"
    r="HALO_R"
    fill="hsla(48,100%,74%,0.35)"
    filter="url(#halo-sm)"
  />

  <!-- 2. Secondary diagonal rays — faint, behind primary rays -->
  <line
    class="peak-ray-diag"
    x1="CX - DIAG_LEN * 0.707"
    y1="CY - DIAG_LEN * 0.707"
    x2="CX + DIAG_LEN * 0.707"
    y2="CY + DIAG_LEN * 0.707"
    stroke="FILL"
    stroke-width="0.4"
    stroke-opacity="0.42"
    stroke-linecap="round"
  />
  <line
    class="peak-ray-diag"
    x1="CX - DIAG_LEN * 0.707"
    y1="CY + DIAG_LEN * 0.707"
    x2="CX + DIAG_LEN * 0.707"
    y2="CY - DIAG_LEN * 0.707"
    stroke="FILL"
    stroke-width="0.4"
    stroke-opacity="0.42"
    stroke-linecap="round"
  />

  <!-- 3. Primary H + V rays — bright, on top of diagonals -->
  <line
    class="peak-ray"
    x1="CX - RAY_LEN"
    y1="CY"
    x2="CX + RAY_LEN"
    y2="CY"
    stroke="FILL"
    stroke-width="0.5"
    stroke-linecap="round"
  />
  <line
    class="peak-ray"
    x1="CX"
    y1="CY - RAY_LEN"
    x2="CX"
    y2="CY + RAY_LEN"
    stroke="FILL"
    stroke-width="0.5"
    stroke-linecap="round"
  />

  <!-- 4. Core — rendered last, topmost, the hot-pixel center -->
  <circle class="peak-core" cx="CX" cy="CY" r="CORE_R" fill="FILL" />
</g>
```

Node count per peak star: 5 elements (was 3). At 7 peaks × 5 variants = 35 extra nodes.
Total remains well under 600.

---

## 3. Non-Peak Spike Stars (count ≥ 8, 30% probability)

User said small background stars look OK. The issue is specifically peaks. However, non-peak
spikes at count=8 have `r ≈ 2.56 px` — still circle-dominant. Apply a lighter version of the
same principle: no halo, but longer rays.

```
// Non-peak spike ray (unchanged: circle stays, rays get longer)
nonPeakRayLen = nonPeakR(count) * 2.8   // was: r * 1.6 → now: r * 2.8
nonPeakDiagLen = nonPeakRayLen * 0.45
diagOpacity = 0.30
```

At count=8: `nonPeakR(8) ≈ 2.56 px`. Ray half-length: 2.56 × 2.8 = **7.2 px** (was 4.1 px).
The ratio `rayLen / r` goes from 1.6 to 2.8. The circle stays as-is (user said small ones are
OK), but the spikes now extend clearly beyond the circle boundary.

Keep the non-peak circle's existing `fill`, `opacity`, `r` — only extend the arm geometry.
No halo, no additional filter on non-peak spikes.

---

## 4. Regular Non-Peak Circles

Unchanged. `r = clamp(0.8 + count * 0.22, 0.8, 3.0)`, cold blue HSL fill, no filter.
User confirmed these are fine.

---

## 5. Background Dust Tints

Current: 80 stars, fill `#ffffff`, class `bg-star`, opacity 0.05–0.30 via CSS `@keyframes twinkle`.

v4: keep the 80-star count. Add HSL tint variation using the existing `noiseSeed` PRNG
(already seeded separately per variant). After drawing position/radius/delay, add one more
`noiseSeed()` call to assign a color bucket.

### Tint palette (exact HSL values)

| Bucket     | Probability | Color       | HSL                  |
| ---------- | ----------- | ----------- | -------------------- |
| Pure white | 72%         | white       | `hsl(0, 0%, 100%)`   |
| Cold cyan  | 9%          | ice blue    | `hsl(200, 45%, 88%)` |
| Warm red   | 7%          | dusty rose  | `hsl(15, 35%, 80%)`  |
| Pale green | 6%          | mint ghost  | `hsl(130, 22%, 80%)` |
| Lavender   | 6%          | soft violet | `hsl(268, 32%, 82%)` |

These are all very high-lightness, low-saturation values. At the existing opacity range
(0.05–0.30 after twinkle), the hue is barely perceptible — it reads as "not quite white"
rather than "colored star". Exactly what was requested: barely noticeable, not garish.

### Implementation

```js
// In the bg-star loop, after r and del are determined:
const tintRoll = noiseSeed();
let starFill;
if (tintRoll < 0.72) starFill = "hsl(0,0%,100%)";
else if (tintRoll < 0.81)
  starFill = "hsl(200,45%,88%)"; // cyan
else if (tintRoll < 0.88)
  starFill = "hsl(15,35%,80%)"; // warm red
else if (tintRoll < 0.94)
  starFill = "hsl(130,22%,80%)"; // green
else starFill = "hsl(268,32%,82%)"; // lavender

el += `<circle cx="..." cy="..." r="..." class="bg-star"
        fill="${starFill}"
        style="animation-delay:-${del.toFixed(2)}s" />`;
```

Remove the hardcoded `fill: #ffffff` from `.bg-star` CSS rule — let the inline `fill`
attribute drive color instead. Keep all other `.bg-star` styles (opacity, animation) unchanged.

Note: the `noiseSeed()` call order is now: cx, cy, r, delay, **tint** (5 calls per star).
This changes the visual distribution of stars from v3 (positions shift because the PRNG
stream advances differently). That is acceptable — the layout is noise-generated and
there is no ground truth to preserve.

---

## 6. Hero Peak (5-pt Star) Decision

Variant B has peak counts up to 30 (vs. 15–19 for other variants). In v3, `peakR(30)` would
produce `r = 3.6 + (30-15)*0.35 = 8.85 px` — a conspicuous solid circle.

**Decision: same treatment, not a special variant. The count-scaled formulas handle it.**

With v4 formulas at count=30:

- `coreR = 0.9 + 15*0.12 = 2.70 px` — still reads as a point
- `haloR = 3.5 + 15*0.6 = 12.5 px` + `halo-lg` filter (stdDeviation 5.0) → bloom radius ~27 px
- `rayLen = 5.0 + 15*1.0 = 20.0 px` → total ray 40 px, clearly dominant

A 40 px ray on a 848 px wide widget is about 4.7% of width — visible, distinctive, but not
absurd. The hero peak at count=30 will be naturally the most dramatic star on the canvas
without needing a special code path. The count-scaling formula is the feature.

**No special hero branch.** Keep `peakFill()` lightness clamp at 92% for counts > 19 to
prevent the core going pure white before the halo does.

---

## 7. Reduced-Motion

No new animations introduced in v4. The pulse animation target changes (halo opacity instead
of drop-shadow), but the freeze mechanism is identical: `animation: none` on `.peak-star`
(which will now be applied to `.peak-halo` elements — rename class or add `.peak-halo` to
the reduced-motion rule).

Updated CSS rule:

```css
@media (prefers-reduced-motion: reduce) {
  .bg-star {
    animation: none;
    opacity: 0.15;
  }
  .peak-star {
    animation: none;
  } /* catches peak-core pulse if kept there */
  .peak-halo {
    animation: none;
  } /* freeze halo opacity at base 0.35 */
  .comet-head {
    display: none;
  }
}
```

The static trail rule from v3 (`strokeDasharray: none`) is unchanged. Confirm existing JS
`prefersReduced` guard still wraps the comet `loop()` call — no change needed there.

---

## 8. Multi-Variant Layout

Unchanged. 5 variants (A through E) stacked vertically, same seeds, same data generation
parameters, same month labels. No layout delta in v4.

---

## 9. Risks and Notes

**Safari SVG filter (feGaussianBlur):** Supported since Safari 6. The `x/y/width/height`
oversized filter region (`x="-150%"` etc.) is necessary to prevent Safari from clipping the
blur at the element bounding box. All three filter definitions above include the oversized
region. No known Safari quirk for static Gaussian blur on circles. Acceptable.

**Performance — 5 variants × up to 7 peaks × feGaussianBlur halos:** Maximum 35 blurred
elements per page. `feGaussianBlur` with `stdDeviation ≤ 5` on circles ≤ 15 px radius is
trivially cheap — the filter region is at most ~60 × 60 px of rasterization per element.
35 × 3600 px² ≈ 126,000 px² total blur work. Modern GPU compositing handles this at 60 fps
without measurable impact. No perf concern.

**Thin-ray anti-aliasing on rotated lines:** 0.4–0.5 px strokes on rotated lines may render
as faint/invisible on non-HiDPI displays at certain angles. `stroke-linecap="round"` mitigates
termination artifacts. If a ray disappears entirely at certain rotations on 1× displays,
increase `stroke-width` from 0.5 to **0.7** for primary rays only. Treat this as a QA check,
not a pre-emptive change.

**RNG stream stability:** Adding a 5th `noiseSeed()` call per background star (for tint)
changes all star positions from v3. This is deliberate and acceptable. The data-star PRNG
stream is separate and unaffected (different seed via `initSeed ^ 0xdeadbeef` XOR).

**Node budget:** 5 variants × (80 bg-stars + ~371 data-circles + 7 peaks × 5 nodes +
~8 non-peak-spikes × 5 nodes) ≈ 5 × 500 = 2,500 SVG elements total. Well within DOM limits.
