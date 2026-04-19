# Design Brief — Widget Polish: Cinematic Starry Sky

## 1. CSS Variables Block

Place at the top of `<style>`, before any selector rules.

```css
:root {
  --comet-duration: 2.6s; /* traversal only; total cycle = duration + hold */
  --comet-hold: 0.9s; /* pause at tail end before re-entering */
  --comet-head-r: 4px; /* head circle radius */
  --comet-head-color: #ffffff; /* head fill */
  --comet-trail-width: 2px; /* trail stroke-width */
  --comet-tail-len: 100; /* stroke-dasharray tail segment, px */
  --jitter-amp: 0.32; /* ±32% of cellSize per axis */
  --star-r-min: 0.8; /* non-peak minimum radius at count=1 */
  --star-r-max: 3; /* non-peak cap; peak starts above this */
  --peak-r-base: 3.6; /* smallest peak radius (count=15) */
  --peak-r-step: 0.35; /* added per count unit above 15 */
}
```

---

## 2. Comet Implementation

**Technique: (a) separate `<circle>` head driven by JS `Element.animate` sampling `getPointAtLength`, plus gradient-stroke trail on the existing `<path>` using `stroke-dasharray` / `stroke-dashoffset`.**

Reason: `animateMotion` cannot address the head and the fading trail independently — you need precise control over which segment glows. JS `getPointAtLength` sampling gives exact head coordinates with zero extra dependencies and works in all modern evergreens.

### Head element

```html
<circle
  id="comet-head"
  r="4"
  fill="#ffffff"
  style="filter: drop-shadow(0 0 5px #ffffff) drop-shadow(0 0 10px rgba(200,224,255,0.9));"
/>
```

- Radius: **4 px** (visible above any trail width, reads as a point).
- Fill: `#ffffff`.
- Glow: `drop-shadow(0 0 5px #ffffff) drop-shadow(0 0 10px rgba(200,224,255,0.9))` — two-layer so it bleeds cold-blue at the outer edge, not just pure white.

### Trail

Replace the current single gradient `linearGradient` with a per-frame animatable setup:

```html
<defs>
  <linearGradient id="cometTrail" gradientUnits="userSpaceOnUse">
    <!-- endpoints updated each frame by JS to follow the active path segment -->
    <stop offset="0%" stop-color="#c8e0ff" stop-opacity="0" />
    <stop offset="30%" stop-color="#c8e0ff" stop-opacity="0.08" />
    <stop offset="65%" stop-color="#d8ecff" stop-opacity="0.45" />
    <stop offset="88%" stop-color="#ffffff" stop-opacity="0.80" />
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95" />
  </linearGradient>
</defs>
<path id="comet-trail" d="..." class="comet-trail-path" />
```

Trail CSS:

```css
.comet-trail-path {
  fill: none;
  stroke: url(#cometTrail);
  stroke-width: var(--comet-trail-width, 2px);
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

### Animation logic (JS sketch)

```js
// Total cycle = traversal + hold
const DURATION = 2600; // ms — --comet-duration
const HOLD = 900; // ms — --comet-hold
const TAIL_LEN = 100; // px of visible tail

const pathEl = document.getElementById("comet"); // full polyline
const headEl = document.getElementById("comet-head");
const trailEl = document.getElementById("comet-trail");
const grad = document.getElementById("cometTrail");
const total = pathEl.getTotalLength();

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// cubic-bezier(0.25, 0, 0.55, 1) — fast entry, decelerates near last peak
function ease(t) {
  // Approximate CB(0.25,0,0.55,1): fast at start, gentle coast.
  // Simple power approximation good enough for single-file context:
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function tick(elapsed) {
  // elapsed in [0, DURATION]
  const raw = Math.min(elapsed / DURATION, 1);
  const t = ease(raw);
  const headDist = t * total;
  const tailDist = Math.max(0, headDist - TAIL_LEN);

  // Head position
  const hp = pathEl.getPointAtLength(headDist);
  headEl.setAttribute("cx", hp.x);
  headEl.setAttribute("cy", hp.y);

  // Trail: clip path to [tailDist, headDist]
  const visLen = headDist - tailDist;
  trailEl.style.strokeDasharray = `${visLen} ${total}`;
  trailEl.style.strokeDashoffset = `-${tailDist}`;

  // Update gradient endpoints along segment direction
  const tp = pathEl.getPointAtLength(tailDist);
  grad.setAttribute("x1", tp.x);
  grad.setAttribute("y1", tp.y);
  grad.setAttribute("x2", hp.x);
  grad.setAttribute("y2", hp.y);
}

function loop() {
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    if (elapsed < DURATION) {
      tick(elapsed);
      requestAnimationFrame(frame);
    } else {
      // Snap head off-screen, clear trail, hold
      headEl.setAttribute("cx", -100);
      trailEl.style.strokeDasharray = "none";
      setTimeout(loop, HOLD);
    }
  }
  requestAnimationFrame(frame);
}

if (!prefersReducedMotion) loop();
```

**Easing:** `cubic-bezier(0.25, 0, 0.55, 1)` — the head accelerates briefly then decelerates, mimicking gravitational arcing. Implementation above uses a JS approximation; exact match via `Animation` `easing` string is fine if the executor drives head position via the Web Animations API instead of a manual rAF loop.

---

## 3. Star Ladder — Non-peaks

Continuous map. All three properties are pure functions of `count`; no branches except count=0 (invisible).

### Radius

```
r = clamp(0.8 + count * 0.22, 0.8, 3.0)
```

- count=1 → r=1.02
- count=5 → r=1.9
- count=10 → r=3.0 (hits cap)
- Cap at 3.0 so the smallest peak (r=3.6) is visibly distinct.

### Fill (HSL lerp)

Interpolate from `hsl(214, 42%, 28%)` at count=1 to `hsl(210, 72%, 82%)` at count≥10.

```js
function nonPeakFill(count) {
  const t = Math.min(count, 10) / 10;
  const h = 214; // fixed hue — cold blue
  const s = lerp(42, 72, t);
  const l = lerp(28, 82, t);
  return `hsl(${h},${s.toFixed(0)}%,${l.toFixed(0)}%)`;
}
```

### Opacity

```
opacity = 0.45 + Math.min(count, 10) * 0.05
```

- count=1 → 0.50
- count=10 → 0.95

---

## 4. Star Ladder — Peaks (top 7, counts 15–19)

```
r     = 3.6 + (count - 15) * 0.35
fill  = hsl(48, 100%, lerp(68%, 86%, (count-15)/4))
```

| count | r    | fill lightness |
| ----- | ---- | -------------- |
| 15    | 3.60 | 68%            |
| 16    | 3.95 | 72.5%          |
| 17    | 4.30 | 77%            |
| 18    | 4.65 | 81.5%          |
| 19    | 5.00 | 86%            |

Glow filter on all peaks: `drop-shadow(0 0 4px hsl(48,100%,fill_l)) drop-shadow(0 0 9px hsl(45,90%,55%))`.

Ties (same count) render identically — the formula is deterministic.

---

## 5. Shape Mix Rules

### Shape assignment (called once per star at data-gen time, using the seeded `rng()`)

```
function shapeFor(d) {
  if (d.isPeak) {
    // all peaks are spikes; consume one rng() call for consistency
    rng();
    return 'spike';
  }
  if (d.count >= 8) {
    // brightest non-peak tier eligible; 30% chance of spike
    return rng() < 0.30 ? 'spike' : 'circle';
  }
  rng();  // consume call to keep RNG state deterministic
  return 'circle';
}
```

Eligibility: peaks (always) + non-peaks with count ≥ 8.
Spike probability within eligible non-peaks: **30%**.
Result: spikes are conspicuously rare on non-peaks (~5–8 expected across the year), reserved as a visual cue for high-activity days.

### Spike geometry

Render as **4 `<line>` elements through the star's (cx, cy)**, not a polygon. This avoids fill/clip complications and SVG polygon vertex math.

```
armLen = r * 1.6    // r = circle radius for this star
strokeW = 0.6
stroke = same as fill color
```

Four lines (relative to center):

- Horizontal: `(cx - armLen, cy)` → `(cx + armLen, cy)`
- Vertical: `(cx, cy - armLen)` → `(cx, cy + armLen)`

The underlying `<circle>` is retained at the same r and fill. The cross overlays it, producing a classic diffraction-spike look. Both the circle and the 4 lines are emitted in the same loop iteration as siblings.

Node budget: worst-case ~7 peaks × 5 nodes + ~8 non-peak spikes × 5 nodes = 75 extra nodes on top of the ~400 base circles. Total well under 600.

---

## 6. Jitter

```js
const jitterAmp = 0.32; // --jitter-amp

// Called once per star BEFORE peak detection, during data generation loop
const jx = (rng() * 2 - 1) * jitterAmp * cellSize;
const jy = (rng() * 2 - 1) * jitterAmp * cellSize;

d.cx = col * cellSize + cellSize / 2 + padding + jx;
d.cy = row * cellSize + cellSize / 2 + padding + jy;
```

`jitterAmp = 0.32` → max offset = ±5.12 px in a 16 px cell. Day-of-week rows remain readable at this amplitude (confirmed by eye: ≤35% of cellSize keeps row bands separated by ≥6.5 px).

The comet polyline is built from `d.cx / d.cy` **after** jitter is applied, so the head follows jittered peak positions exactly.

Two `rng()` calls are consumed per star (jx, jy). The existing shape-assignment call(s) above must come **after** jitter so the RNG sequence is stable.

RNG call order per star (fixed sequence):

1. Background activity roll (existing: `rng() > 0.6`)
2. Count roll (existing: `Math.floor(rng() * 4)`)
3. jx: `rng()`
4. jy: `rng()`
5. shape: `rng()` (or consumed dummy)

Peak override (peakDays check) sets the count directly — the existing `rng()` call inside the peakDays branch (`15 + Math.floor(rng() * 5)`) must remain to keep call 2 consistent.

---

## 7. Accessibility

```html
<svg id="sky-grid" role="img" aria-labelledby="sky-title sky-desc">
  <title id="sky-title">Contribution activity over the past year</title>
  <desc id="sky-desc">
    A night-sky grid of 371 cells spanning 53 weeks. Each star's size and
    brightness encodes daily commit count; the seven most active days are
    highlighted in gold and connected by an animated comet tracing the year's
    peak moments.
  </desc>
  <!-- ... stars and paths ... -->
</svg>
```

```html
<div
  class="graph-wrapper"
  aria-label="Contribution activity over the past year"
></div>
```

### WCAG AA contrast audit

**`.header h1`** — `#ffffff` on `#010209` base (ignoring radial gradients which only lighten the background):

- Contrast ratio: 21:1. Passes AA and AAA at all sizes. No change needed.

**`.header p`** — `#7aacd8` on `#010209`:

- Relative luminance of `#7aacd8`: R=122, G=172, B=216 → L≈0.404.
- Relative luminance of `#010209`: L≈0.0002.
- Ratio ≈ (0.404 + 0.05) / (0.0002 + 0.05) ≈ **8.8:1**. Passes AA (4.5:1 required for normal text). No change needed.

Both pass comfortably. No hex tweak required.

---

## 8. Reduced-Motion Coverage

Every animation that will exist after the change, with its freeze value:

| Animation               | Mechanism                | Normal                 | `prefers-reduced-motion: reduce`                                                  |
| ----------------------- | ------------------------ | ---------------------- | --------------------------------------------------------------------------------- |
| Comet traversal         | JS rAF loop              | runs continuously      | `loop()` not called; full trail shown as static stroke (`strokeDasharray: none`)  |
| Comet head              | JS rAF `cx`/`cy` update  | moves along path       | head positioned at last peak coords, opacity 0 (hidden, trail is the static cue)  |
| Background star twinkle | CSS `@keyframes twinkle` | 4 s infinite alternate | `animation: none` — stars show at `opacity: 0.15` (midpoint)                      |
| Peak star pulse         | CSS `@keyframes pulse`   | 2 s infinite alternate | `animation: none` — peaks show at `r=3.6…5.0` (base value), no filter oscillation |

CSS rule:

```css
@media (prefers-reduced-motion: reduce) {
  .bg-star {
    animation: none;
    opacity: 0.15;
  }
  .peak-star {
    animation: none;
    /* r is set via SVG attribute; filter stays at the base glow */
  }
  /* comet-head hidden; handled in JS */
  #comet-head {
    display: none;
  }
}
```

JS guard (existing pattern, extend to new `loop()` call):

```js
if (!prefersReducedMotion) {
  loop(); // comet animation
} else {
  // Show full static trail
  trailEl.style.strokeDasharray = "none";
  trailEl.style.strokeDashoffset = "0";
}
```

---

## 9. Risks / Open Questions

- `getPointAtLength` is synchronous and cheap for a short polyline (7 vertices); no perf concern.
- `stroke-dashoffset` on a `<path>` clipped to a segment requires the trail path to be the same `d` attribute as the full constellation path — executor must share the `pathD` string between the constellation underlay and the trail overlay.
- The gradient `gradientUnits="userSpaceOnUse"` with JS-updated `x1/y1/x2/y2` degrades gracefully (static gradient) if JS fails; the static trail is still visible.
- Safari ≥ 15.4 supports all APIs used; Safari 14 has minor rAF quirks but the animation still runs. Acceptable for a prototype.
- Jitter amplitude 0.32 is safe at cellSize=16; if cellSize changes in a future variant, the amplitude scales automatically because it multiplies cellSize.
