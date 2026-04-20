# Design Brief v2 — Widget Polish: Iteration #2 Naturalism Pass

Iteration #1 shipped a coherent starfield. Iteration #2 makes it photorealistic: faster comet, richer star morphology, per-star glow intensity driven by activity data, and a composite comet head.

---

## §1. Timing Deltas

### CSS variables

```css
:root {
  --comet-duration: 1.05s; /* was 2.6 s — 2.5× faster per user request */
  --comet-hold: 1.55s; /* was 0.9 s — total cycle stays ≈2.6 s so the eye lands on sky before re-entry */
  --comet-tail-len: 130; /* was 100 — longer tail compensates for faster head; reads as luminous smear */
}
```

**Rationale — duration 1.05 s:** User asked for 2.5× acceleration (2.6 / 2.5 = 1.04 s). Round to 1.05 s so the JS constant is a clean integer (1050 ms). At this speed the head visibly snaps across the path, which matches the reference GIF's sharp streak.

**Rationale — hold 1.55 s:** Total cycle = 1.05 + 1.55 = 2.6 s — identical to iteration #1's total cycle length. The sky never feels hectic because the blank-sky window is still 60 % of the cycle. The comet earns its re-entrance.

**Rationale — tail-len 130:** A faster head with the old 100 px tail would produce a visually short smear. At 130 px the tail occupies a proportionally similar fraction of the path while the head is at peak velocity. If testing reveals it reads as a smear rather than a tail, try 110 px. Do not exceed 150 px — the tail would bleed past peaks at the slower path segments.

### JS constants

```js
const DURATION = 1050; // ms — --comet-duration
const HOLD = 1550; // ms — --comet-hold
const TAIL_LEN = 130; // px — --comet-tail-len
```

### Easing

Unchanged from iteration #1 (`t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2`). At 1.05 s the cubic approximation already gives a satisfying snap-and-decelerate feel — the acceleration phase is only ~0.4 s, which reads as a bright flash entry. No sharpening needed; the shorter duration does the work.

---

## §2. New Star Shape Vocabulary

Define four `<symbol>` elements inside `<defs>`. All strokes and fills use `currentColor` so the `color` CSS property on the wrapping `<use>` element controls the tint uniformly.

```xml
<symbol id="star-dot" viewBox="-4 -4 8 8" overflow="visible">
  <!-- tiny circle; default non-peak rendering for count 1-7 -->
  <circle cx="0" cy="0" r="1" fill="currentColor" />
</symbol>

<symbol id="star-cross" viewBox="-8 -8 16 16" overflow="visible">
  <!-- circle + 4-arm cross; mid-tier stars -->
  <circle cx="0" cy="0" r="1.4" fill="currentColor" />
  <line x1="0" y1="-3.2" x2="0"  y2="3.2"  stroke="currentColor" stroke-width="0.6" />
  <line x1="-3.2" y1="0" x2="3.2" y2="0"   stroke="currentColor" stroke-width="0.6" />
</symbol>

<symbol id="star-twinkle" viewBox="-12 -12 24 24" overflow="visible">
  <!-- circle + 4 long thin diffraction spikes; reads as a distant bright star -->
  <circle cx="0" cy="0" r="1.6" fill="currentColor" />
  <line x1="0" y1="-7" x2="0"  y2="7"  stroke="currentColor" stroke-width="0.4" opacity="0.85" />
  <line x1="-7" y1="0" x2="7"  y2="0"  stroke="currentColor" stroke-width="0.4" opacity="0.85" />
  <!-- secondary diagonal spikes, half-length — subtle, not a snowflake -->
  <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="currentColor" stroke-width="0.25" opacity="0.45" />
  <line x1="3.5"  y1="-3.5" x2="-3.5" y2="3.5" stroke="currentColor" stroke-width="0.25" opacity="0.45" />
</symbol>

<symbol id="star-five" viewBox="-10 -10 20 20" overflow="visible">
  <!-- 5-point star polygon; rare hero-day shape -->
  <!-- outer r=5.5, inner r=2.3, 5 points; vertices pre-computed at 0° offset -->
  <polygon
    points="0,-5.5 1.3,-2.0 4.7,-1.7 2.3,0.9 3.4,4.4
            0,2.8 -3.4,4.4 -2.3,0.9 -4.7,-1.7 -1.3,-2.0"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="0.3"
    stroke-linejoin="round"
  />
</symbol>
```

**Node budget check:** 4 symbols (defs only, no rendering cost) + ~371 `<use>` elements for data stars + ~150 bg-star `<circle>` elements + path/head elements = ~530 rendered nodes. Well under 800.

---

## §3. Shape Assignment — `shapeFor(d)`

RNG call order **appended** after the existing 5-call sequence (unchanged: activity, count, jx, jy, shape-roll). Two new calls per star (rotation roll = call 6, scale roll = call 7) follow the shape roll.

```js
// Peaks: sorted by count descending BEFORE shapeFor is called.
// The highest-count peak is identified once and stored as `heroDay`.
// heroDay.day is set during the peak-identification pass.

function shapeFor(d, isHero) {
  // Call 5 — shape roll (consumed for all paths to keep RNG stable)
  const roll = rng();

  if (d.isPeak) {
    return isHero ? "five" : "twinkle";
  }

  if (d.count >= 8) {
    // count 8+ : 60% cross, 40% twinkle
    return roll < 0.6 ? "cross" : "twinkle";
  }

  if (d.count >= 4) {
    // count 4-7 : 80% dot, 20% cross
    return roll < 0.8 ? "dot" : "cross";
  }

  // count 1-3 : always dot
  return "dot";
}
```

**Hero identification (before the `data.forEach` shape pass):**

```js
// After topDays is built:
const heroDay = topDays.reduce(
  (best, d) => (data[d.day].count > data[best.day].count ? d : best),
  topDays[0],
);
data[heroDay.day].isHero = true;
```

**Usage in loop:**

```js
data.forEach((d) => {
  d.shape = shapeFor(d, d.isHero === true);
  // calls 6 & 7 consumed here, see §5
  d.rotDeg = (rng() * 2 - 1) * 45;
  d.scaleMul = 1 + (rng() * 2 - 1) * 0.15;
});
```

**Updated RNG call-order table:**

| Call # | Purpose                  | Notes                                  |
| ------ | ------------------------ | -------------------------------------- |
| 1      | Background activity roll | unchanged                              |
| 2      | Count roll               | unchanged (peak branch also uses this) |
| 3      | jx                       | unchanged                              |
| 4      | jy                       | unchanged                              |
| 5      | Shape roll               | consumed for every star                |
| 6      | Rotation roll (new)      | `(rng()*2-1)*45` → rotDeg              |
| 7      | Scale jitter (new)       | `1+(rng()*2-1)*0.15` → scaleMul        |

The peak count roll inside the `peakDays` branch (existing `15 + Math.floor(rng()*5)`) remains call 2 for those days; calls 3-7 then fire in order. Sequence is stable.

---

## §4. Brightness and Size — Dynamic Range Widening

### Radius

Unchanged: `r = clamp(0.8 + count * 0.22, 0.8, 3.0)` for non-peaks.  
Unchanged: `r = 3.6 + (count - 15) * 0.35` for peaks (range 3.60–5.00).

The scaleMul from §3 call 7 applies on top: final rendered size = `r * d.scaleMul`. This gives a ±15 % variation between same-count days.

### Opacity ramp (widened)

```js
function nonPeakOpacity(count) {
  // was: 0.45 + Math.min(count, 10) * 0.05  → range [0.50, 0.95]
  // new: wider dim end so faint stars barely register; bright end unchanged
  return 0.35 + Math.min(count, 10) * 0.065; // range [0.415, 1.0], clamp to 1.0
}
```

count=1 → 0.415 (barely visible), count=10 → 1.0 (fully opaque). The bottom of the range drops 8.5 pp, making micro-dust stars feel recessed.

### SVG filter definitions (new, add to `<defs>`)

```xml
<!-- No glow: zero overhead; reference kept for code symmetry -->
<filter id="glow-none" x="0%" y="0%" width="100%" height="100%">
  <feComposite in="SourceGraphic" in2="SourceGraphic" operator="over" />
</filter>

<!-- Soft glow: mid-count non-peaks -->
<filter id="glow-soft" x="-60%" y="-60%" width="220%" height="220%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="b" />
  <feMerge>
    <feMergeNode in="b" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>

<!-- Bright glow: high-count non-peaks and comet head mid-halo -->
<filter id="glow-bright" x="-80%" y="-80%" width="260%" height="260%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="3.0" result="b" />
  <feMerge>
    <feMergeNode in="b" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>

<!-- Gold bloom: peak stars (two-pass, from Gemini pattern) -->
<filter id="glow-gold" x="-80%" y="-80%" width="260%" height="260%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
  <feMerge>
    <feMergeNode in="blur2" />
    <feMergeNode in="blur1" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

**`glow(count)` assignment:**

```js
function glowFilter(count) {
  if (count <= 3) return ""; // no filter attr — zero GPU cost
  if (count <= 7) return "url(#glow-soft)"; // stdDeviation 1.6
  return "url(#glow-bright)"; // stdDeviation 3.0
}
```

Peaks: always `filter="url(#glow-gold)"` (unchanged from iteration #1 concept; now uses the proper `<filter>` element instead of CSS `drop-shadow`).

**Non-peak fill and opacity:** unchanged formulas (`nonPeakFill`, `nonPeakOpacity` except the widened ramp above).

---

## §5. Position Variety Without Breaking the Grid

### Unchanged

`--jitter-amp: 0.32` — unchanged. Grid rows stay readable.

### New: per-star rotation and scale (from §3 calls 6 & 7)

Rotation applies only to `star-cross`, `star-twinkle`, and `star-five`. `star-dot` (a circle) is rotationally symmetric — skip the transform to avoid a redundant attribute.

```js
// Render as <use> with transform:
const needsRot = ["cross", "twinkle", "five"].includes(d.shape);
const rot = needsRot ? d.rotDeg : 0;
const scale = d.scaleMul; // always applied

// SVG attribute:
// transform="translate(cx,cy) scale(scaleMul) rotate(rotDeg)"
```

The `translate` keeps (cx,cy) as the anchor, `scale` then `rotate` apply in local space — standard SVG transform order.

---

## §6. Comet Head Composite

Replace the plain `<circle id="comet-head">` with a `<symbol>` and a `<use>`.

### Symbol definition (add to `<defs>`)

```xml
<symbol id="comet-head-shape" viewBox="-12 -12 24 24" overflow="visible">
  <!-- Layer 1: outer translucent halo -->
  <circle cx="0" cy="0" r="9"   fill="rgba(200,224,255,0.15)" filter="url(#glow-bright)" />
  <!-- Layer 2: mid halo -->
  <circle cx="0" cy="0" r="5"   fill="rgba(255,255,255,0.35)" />
  <!-- Layer 3: bright core -->
  <circle cx="0" cy="0" r="2.5" fill="#ffffff"               filter="url(#glow-soft)" />
  <!-- Layer 4: 4 thin diffraction flare lines -->
  <line x1="0" y1="-6" x2="0"  y2="6"  stroke="#ffffff" stroke-width="0.4" opacity="0.70" />
  <line x1="-6" y1="0" x2="6"  y2="0"  stroke="#ffffff" stroke-width="0.4" opacity="0.70" />
</symbol>
```

### HTML placement (replaces old `<circle id="comet-head">`)

```xml
<use id="comet-head" href="#comet-head-shape" x="-100" y="-100" />
```

### JS update

`getPointAtLength` returns the head center. Position via:

```js
headEl.setAttribute("x", hp.x);
headEl.setAttribute("y", hp.y);
```

Note: `<use>` positions via `x`/`y`, not `cx`/`cy`. The existing `setAttribute("cx", ...)` calls must be updated to `setAttribute("x", ...)`.

Flare lines (Layer 4): always visible during traversal. During hold phase the entire head is offscreen (`x="-100" y="-100"`), so no separate hide step is needed for the flares.

### Trail gradient — smokier tail end

Update the `stop-opacity` at offset 0 % from 0 → 0 (unchanged) but extend the transparent leading section:

```xml
<linearGradient id="cometTrail" gradientUnits="userSpaceOnUse">
  <stop offset="0%"   stop-color="#c8e0ff" stop-opacity="0"    />
  <stop offset="40%"  stop-color="#c8e0ff" stop-opacity="0.05" />
  <stop offset="68%"  stop-color="#d8ecff" stop-opacity="0.42" />
  <stop offset="88%"  stop-color="#ffffff" stop-opacity="0.80" />
  <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95" />
</linearGradient>
```

Change from iteration #1: the 30 % stop moves to 40 %, giving a longer "smoke dissipating" zone at the tail end and a sharper bright burst closer to the head. Matches the reference GIF description (long tapering luminous tail, sharp head).

---

## §7. Background Dust Layer

Replace the 80-element single-tier loop with a two-tier loop. Uses `Math.random()` — not seeded — this layer is purely decorative.

```js
// Tier 1: 100 micro-dust — barely perceptible depth layer
for (let i = 0; i < 100; i++) {
  const cx = Math.random() * 848 + padding;
  const cy = Math.random() * 112 + padding;
  const r = 0.2 + Math.random() * 0.3; // 0.2–0.5
  const op = 0.08 + Math.random() * 0.1; // 0.08–0.18
  elements += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="${op.toFixed(2)}" />`;
  // No animation class — intentional; zero GPU overhead
}

// Tier 2: 50 near-dust — visible, participate in twinkle
for (let i = 0; i < 50; i++) {
  const cx = Math.random() * 848 + padding;
  const cy = Math.random() * 112 + padding;
  const r = 0.5 + Math.random() * 0.7; // 0.5–1.2
  const op = 0.2 + Math.random() * 0.2; // 0.20–0.40
  const delay = Math.random() * 4;
  elements += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="${op.toFixed(2)}" class="bg-star" style="animation-delay:-${delay.toFixed(1)}s" />`;
}
```

Total bg elements: 150 (was 80). Total node count: ~150 bg + ~220 active-day `<use>` + path/head elements ≈ 380 rendered nodes. Comfortably under 800.

---

## §8. Reduced-Motion Coverage

Full animation inventory after iteration #2 changes:

| Animation              | Mechanism                              | Normal state             | `prefers-reduced-motion: reduce`                                 |
| ---------------------- | -------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| Comet traversal        | JS rAF loop (DURATION/HOLD constants)  | runs continuously        | `loop()` not called; full trail shown as static stroke           |
| Comet head (composite) | JS rAF `x`/`y` on `<use>`              | moves along path         | `#comet-head { display: none }` — targets the `<use>` element    |
| Comet flare lines      | Part of `#comet-head-shape` symbol     | visible during traversal | hidden as part of `#comet-head { display: none }` (same `<use>`) |
| BG star twinkle        | CSS `@keyframes twinkle` on `.bg-star` | 4 s infinite alternate   | `animation: none; opacity: 0.15` (midpoint value)                |
| Peak star pulse        | CSS `@keyframes pulse` on `.peak-star` | 2 s infinite alternate   | `animation: none` — static glow from SVG `filter` attribute      |

CSS rule update — the selector `#comet-head` now targets the `<use>` element, which is correct (same id, different element type than iteration #1's `<circle>`):

```css
@media (prefers-reduced-motion: reduce) {
  .bg-star {
    animation: none;
    opacity: 0.15;
  }
  .peak-star {
    animation: none;
  }
  #comet-head {
    display: none;
  } /* targets <use href="#comet-head-shape"> */
}
```

No new CSS `@keyframes` are introduced in iteration #2. The `rotDeg` and `scaleMul` attributes are set at render time (static), not animated.

---

## §9. What NOT to Change

- `padding = 10` — reject Gemini's `padX = padY = 20`.
- Grid geometry: 53 × 7 cells, `cellSize = 16`, Mon/Wed/Fri row labels, month labels top.
- Seed: `124`.
- `peakDays = [24, 75, 140, 195, 250, 310, 345]`.
- Peak radius formula, peak fill formula, peak glow layer count.
- Header copy style (Space Mono, existing sizes, `#ffffff` / `#7aacd8` colors).
- `nonPeakFill()` HSL interpolation (hue 214, s 42→72, l 28→82).
- Constellation underlay path (dashed grey stroke at 10 % opacity).

---

## §10. Risks

- **Filter perf on 150 bg-stars:** Tier-1 micro-dust has no filter and no animation — zero GPU cost. Tier-2 near-dust has twinkle (CSS opacity animation) but no feGaussianBlur. Data stars with `glow-soft`/`glow-bright` are the expensive set; expect ~40–60 filtered elements. Should be fine on any GPU released after 2019; measure on mobile if the embed target is iOS Safari.
- **`<use>` + `x`/`y` vs `transform`:** Positioning `<use>` via `x`/`y` attributes is fully supported in all evergreens including Safari 14+. The `href` attribute (not `xlink:href`) requires Safari 12+. Safe for this project's target.
- **`<use>` referencing `<symbol>` with nested `filter` references:** Safari occasionally mispaints `filter` inside a `<symbol>` when the symbol is used with a non-identity transform. Mitigation: define the filters globally in `<defs>` (as specified above) rather than inline inside the `<symbol>` child elements. The symbol's children reference filter IDs from the document root, not from within the symbol's own subtree.
- **Short duration + long gradient path:** At 1.05 s the head covers the full polyline quickly. At a path vertex (angle change) the gradient endpoint update happens mid-frame, potentially causing a single-frame gradient flip. This was acceptable in iteration #1 at 2.6 s; at 1.05 s it may be more noticeable. If visible: clamp gradient update to fire only when `visLen > 10` (skip the very first frame of each segment).
- **`star-five` polygon vertex math:** The pre-computed polygon points assume outer radius 5.5, inner radius 2.3, 5-fold symmetry, 0° start. Confirm rendering in browser before final; adjust inner radius to 2.6 if the points read as too narrow.
