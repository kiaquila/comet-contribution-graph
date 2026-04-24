# Designer feasibility memo — comet tail in SMIL SVG

## Prototype recipe

The prototype tail is pure JS + DOM — no SVG filters, no gradients baked at build time.
On every `requestAnimationFrame` it does three things simultaneously:

1. A `<path>` (same polyline as the constellation) has its `strokeDasharray` and
   `strokeDashoffset` rewritten each frame to show only the live segment
   `[tailDist, headDist]`, where `tailDist = max(0, headDist - 70px)`. This produces
   the "erasing tail" effect: the trail is always exactly 70 px long and retreats
   as the comet moves.
2. A `<linearGradient>` with `gradientUnits="userSpaceOnUse"` has its `x1/y1/x2/y2`
   endpoints rewritten each frame to `(tailPoint, headPoint)`, so the gradient
   always aligns with the current tail direction. 5 stops: transparent at 0%,
   barely-visible at 30%, semi-opaque at 65%, near-opaque at 88%, fully opaque
   white at 100%.
3. A separate `<circle>` (the head) is repositioned each frame via `getPointAtLength(headDist)`.

Visual recipe: tail = gradient-stroked path segment, 70 px long, tapered from
transparent to bright white, oriented along direction of travel by repositioning
gradient endpoints in user space. Head glow = CSS `filter: drop-shadow(...)` inline.

## Current state (shipped renderer)

`renderComet()` in `src/renderer.ts` uses a completely different approach:
4 ghost particles + coma + nucleus, all `<circle>` with `<animateMotion>`.

- `COMET_TRAIL` = 4 particles with `beginOffsetS` 0.18s, 0.36s, 0.54s, 0.72s
  (staggered — they started motion earlier so they lag behind the head).
- Radii 1.8, 1.3, 0.9, 0.6 px. Opacities 0.45, 0.28, 0.16, 0.08.
- Coma: two halos (r=9 @ 28%, r=5.5 @ 55%). Nucleus r=2.2 @ 100%.
- No gradient tail. At normal path lengths (371-day profile) the stagger visually
  reads as ~15-20 px smear — ghostly but not a directional tapered tail.

## Feasibility — options ranked

### Option A (current, extendable)

Extend from 4 to 10 staggered ghost particles, widen radius curve (2.2 → 0.3)
and opacity curve (0.6 → 0.03). SMIL-native, camo-safe. Cost: ~180 bytes per
particle; 10 particles total adds ~1.4 KB.

### Option B (recommended)

Gradient `<ellipse>` with `rotate="auto"` on `<animateMotion>`.

`<animateMotion rotate="auto">` causes the element to rotate to follow the path
tangent. Attach an elongated `<ellipse>` (rx=48, ry=2.8) with a horizontal
`<linearGradient>` (transparent-left to bright-right) and set `rotate="auto"`.
Head of the ellipse tracks the comet position; body sweeps back along direction
of travel. Closest SMIL analogue to the prototype's gradient tail.

Pitfalls:
- `rotate="auto"` support is inconsistent across SVG renderers — but all
  Chromium/WebKit/Gecko versions from the last 5+ years support it. Low real-world risk.
- Gradient must be in element's local coordinate system (not `userSpaceOnUse`),
  so it always points head-to-tail correctly after rotation.
- Ellipse clips at sharp direction changes. Contribution grid is largely
  horizontal traversal with occasional diagonals — tolerable.

### Option C — `stroke-dasharray` animated on path (inferior)

SMIL can animate `stroke-dasharray`, but the gradient alignment cannot follow
(`userSpaceOnUse` x1/y1 attrs aren't animatable in a way that tracks the tail).
Produces a trail-shaped mask with static/poorly-oriented gradient. Inferior
visual result vs. B.

### Option D — `<feGaussianBlur>` motion trail

Filters are static — blur direction would not adapt to path tangent. Could
supplement Option B by softening the ellipse; not a standalone approach.

## Recommended approach

**Primary**: Option B (rotating gradient ellipse).
**Secondary**: extend Option A (more ghost particles) to add density behind
the gradient ellipse.

Sketch for the tail fragment:

```xml
<defs>
  <linearGradient id="tail-grad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="#c8e0ff" stop-opacity="0" />
    <stop offset="40%"  stop-color="#c8e0ff" stop-opacity="0.08" />
    <stop offset="70%"  stop-color="#d8ecff" stop-opacity="0.40" />
    <stop offset="90%"  stop-color="#ffffff" stop-opacity="0.75" />
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
  </linearGradient>
</defs>

<ellipse cx="-48" cy="0" rx="48" ry="2.8" fill="url(#tail-grad)">
  <animateMotion dur="8.30s" repeatCount="indefinite"
    keyTimes="0;0.5784;1" keyPoints="0;1;1" calcMode="linear"
    rotate="auto" path="M x1,y1 L x2,y2 ..." />
  <animate attributeName="opacity" dur="8.30s"
    keyTimes="0;0.5784;0.5794;1" values="1;1;0;0"
    repeatCount="indefinite" />
</ellipse>
```

With `cx="-48"` the ellipse's leading edge (x=0 in local coords) sits on the
motion point — gradient's 100% stop (bright/white) is at the head, 0% stop
(transparent) is at the tail tip.

## Risks

- `rotate="auto"` at sharp path corners: one-frame tangent snap. Near-horizontal
  contribution grid path = invisible artifact.
- Gradient `id="tail-grad"` collides if SVG is inlined multiple times on a page
  (dark + light `<picture>` sources simultaneously). Same namespacing pattern as
  `organic-sphere` filter already solves this.
- `rx=48` must be clamped on short paths: `rx = min(48, pathLength * 0.35)`.
  On a sparse profile with 2-3 peaks total path may be only 80-100 px.

## Verdict: GO-WITH-COMPROMISE

The prototype's exact technique (JS `getPointAtLength` + per-frame gradient
repositioning) cannot be ported to SMIL. However, a SMIL-native gradient ellipse
with `rotate="auto"` produces a visually equivalent result: tapered, directional,
glowing tail that tracks the comet's direction of travel. Compromise: direction
changes are instantaneous rather than smoothly interpolated — invisible on the
contribution grid's near-horizontal path structure.
