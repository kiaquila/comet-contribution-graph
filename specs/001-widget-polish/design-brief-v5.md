# Design Brief v5 — Organic-Edge Sphere Overlay + Comet Slowdown + Variant B Peak Shrink

Iteration on v4 (`prototypes/variant-d-grid-peaks.html`). Three targeted changes only.
Everything not listed here is unchanged from v4.

---

## 1. Comet Slowdown (×7)

| Variable               | v4 value           | v5 value                           | Why                                                                                                                                                         |
| ---------------------- | ------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DURATION` (JS const)  | 480 ms             | **3360 ms**                        | ×7 slower; the comet should feel like it's drifting across space, not darting. Cosmically slow.                                                             |
| `HOLD` (JS const)      | 1350 ms            | **1500 ms**                        | Slightly longer than v4 but not dead — 1.5 s of stillness lets the eye rest on the destination peak before the next traverse. Total cycle: 4860 ms.         |
| `TAIL_LEN` (JS const)  | 100 px             | **70 px**                          | Shorter at slow speed. At 3360 ms the comet moves ~0.84 px/ms; a 70 px tail represents ~83 ms of travel — reads as a "wake", not a slash. See note below.   |
| CSS `--comet-duration` | 0.48s              | **3.36s**                          | Mirror of JS constant.                                                                                                                                      |
| CSS `--comet-hold`     | 1.35s              | **1.5s**                           | Mirror of JS constant.                                                                                                                                      |
| Easing                 | ease-in-out approx | **`cubic-bezier(0.4, 0, 0.6, 1)`** | Symmetric gentle S-curve. Slight acceleration out of rest, symmetric deceleration into arrival. Avoids linear (mechanical) and standard ease (front-heavy). |

**Tail length rationale:** At 480 ms (v4), 100 px = 21% of duration expressed as pixels-per-100ms. At 3360 ms, that same 100 px would render as a long dragging smear — the comet looks like it's towing a barge. 70 px at the new speed reads as the requested "небольшой белый исчезающий шлейф": a soft white wake that confirms motion without dominating the head.

**Total cycle:** 3360 + 1500 = **4860 ms** (~12 traversals/minute). Meditative, not dead.

---

## 2. Peak Halo — Organic-Edge Soft Sphere Overlay

### Problem

The v4 halo circle + `feGaussianBlur` is geometrically perfect. The user asked for "размытые полупрозрачные сферы с не очень ровными краями" — blurred translucent spheres with somewhat irregular edges. The cleanness breaks hyperrealism.

### Implementation choice: approach (a) — `feTurbulence + feDisplacementMap`

**Chosen over (b) and (c) because:** turbulence-displaced geometry is the only approach that produces genuinely irregular edges rather than layered circles that read as concentric rings or a soft gradient that reads as a lens flare. The "not-quite-round" quality needs actual boundary deformation, not layering or falloff tricks.

**Performance check:** The organic overlay filter is applied to a second `<circle>` element per peak (same node budget math as the v4 halo). At `baseFrequency="0.035"` the turbulence tile is large (low-frequency), so GPU rasterization cost per element is minimal. 35 elements × small circle bounding box = acceptable. Same conclusion as v4 Section 9 risk analysis.

### New filter definition

Add one filter to `<defs>`, alongside the existing `halo-sm/md/lg` filters:

```xml
<filter id="organic-sphere" x="-80%" y="-80%" width="260%" height="260%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" result="displaced" />
  <feGaussianBlur in="displaced" stdDeviation="2.0" />
</filter>
```

Parameter rationale:

- `baseFrequency="0.035"` — low frequency → large-scale deformation. Produces broad lobes, not fine texture. The edge reads as "slightly non-round", not "spiky noise".
- `scale="4"` — displacement amplitude 4 px. At sphere radii of 5–19 px, 4 px of edge wander is 20–80% of radius — enough to be visible, not enough to look shattered.
- `stdDeviation="2.0"` — final blur softens the displaced edge so it fades into space rather than terminating sharply. The sphere reads as gaseous.
- `numOctaves="2"` — one octave is too smooth (nearly round), three+ adds cost with diminishing visual return.
- `seed="7"` — arbitrary; produces a left-leaning irregular form. Change if testing reveals an obviously degenerate shape.

### New overlay circle — per peak star

Render a new `<circle class="peak-sphere">` as the **second layer** in the star group, between the halo and the diagonal rays:

```html
<g transform="rotate(ANGLE, CX, CY)">
  <!-- 1. Halo — feGaussianBlur, behind everything (unchanged from v4) -->
  <circle
    class="peak-halo"
    cx="CX"
    cy="CY"
    r="HALO_R"
    fill="hsla(48,100%,74%,0.35)"
    filter="url(#halo-sm|md|lg)"
  />

  <!-- 2. NEW: Organic sphere overlay -->
  <circle
    class="peak-sphere"
    cx="CX"
    cy="CY"
    r="SPHERE_R"
    fill="hsla(50,80%,96%,0.20)"
    filter="url(#organic-sphere)"
  />

  <!-- 3. Secondary diagonal rays (unchanged from v4) -->
  <!-- 4. Primary H+V rays (unchanged from v4) -->
  <!-- 5. Core — rendered last (unchanged from v4) -->
</g>
```

**Sphere sizing:**

```
SPHERE_R = haloR * 1.5
```

| count     | haloR   | SPHERE_R     |
| --------- | ------- | ------------ |
| 15        | 3.50 px | **5.25 px**  |
| 17        | 4.70 px | **7.05 px**  |
| 19        | 5.90 px | **8.85 px**  |
| 30 (hero) | 12.5 px | **18.75 px** |

**Fill:** `hsla(50, 80%, 96%, 0.20)` — near-white with a very faint warm tint (not pure cold white), opacity 0.20. After turbulence displacement and final Gaussian blur the effective rendered opacity is lower than the declared value; 0.20 gives enough presence to read without competing with the gold halo beneath.

**CSS class:** `.peak-sphere` — no animation. Static overlay. No changes needed to reduced-motion rules (static elements are unaffected).

### Rendering order — updated

```
halo filter-blurred → organic sphere (NEW) → diagonal rays → primary rays → core
```

This matches the user's request: the sphere sits on top of the halo bloom but under the rays and core, so the rays punch through the milky sphere center.

---

## 3. Variant B Peak Shrink

### Problem

Variant B peaks reach count=30. v4 formula at count=30: `rayLen = 20 px` (half-length, 40 px total). User: "сейчас они слишком огромные."

### Implementation choice: Option A — clamp all scaling at count=19

**Chosen over B and C because:** Option C (rayLen clamp only) still allows the halo to grow to 12.5 px and the sphere to 18.75 px, which is still visually large. Option B (log-scale) adds formula complexity for a single-variant concern. Option A is one line: `const effectiveCount = Math.min(count, 19)` before the formula block. Clean, zero branching, no secondary formula.

### Change

In the peak-rendering function, before computing `coreR`, `haloR`, `rayLen`, `diagLen`:

```js
const c = Math.min(count, 19); // clamp for visual scale only
// then use c in place of count for all peak geometry:
const coreR = 0.9 + (c - 15) * 0.12;
const haloR = 3.5 + (c - 15) * 0.6;
const rayLen = 5.0 + (c - 15) * 1.0;
// fill color still uses the original count (not c) so hero stars keep white-hot core
const fill = peakFill(count); // unchanged
```

At count=30 with clamp:

| Metric   | v4 (unclumped)     | v5 (clamped at 19)    |
| -------- | ------------------ | --------------------- |
| coreR    | 2.70 px            | **1.38 px**           |
| haloR    | 12.50 px           | **5.90 px**           |
| SPHERE_R | 18.75 px           | **8.85 px**           |
| rayLen   | 20.0 px (40 total) | **9.0 px (18 total)** |

The hero peak is now the same geometry as a count=19 peak, but with the white-hot fill of a count=30 peak — it reads as the brightest star, not the biggest.

---

## 4. Everything Else

Unchanged from v4:

- Non-peak spike stars (`nonPeakRayLen = nonPeakR * 2.8`)
- Regular non-peak circles
- Background dust tints and PRNG stream
- Multi-variant layout (5 variants, same seeds)
- Halo filter definitions (`halo-sm`, `halo-md`, `halo-lg`) and selection logic
- `peakFill()` lightness ramp and clamp
- All v4 diffraction spike formulas for counts 15–19

---

## 5. Reduced-Motion

The organic sphere overlay is **static** — no animation, no keyframe, no JS interval. No changes to `@media (prefers-reduced-motion: reduce)` rules. The new `.peak-sphere` elements freeze naturally (they were never animated). The comet slowdown affects only the running animation; the existing `prefersReduced` guard that suppresses the comet `loop()` call handles it identically to v4.
