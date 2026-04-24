# 009 — comet tail — implementation plan

## Touch list

- `src/renderer.ts` — main change (see Changes below).
- `tests/fixtures/bcherny.json` — NEW. 4th benchmark fixture (bcherny =
  very-dense activity profile, d=0.66). Fetched via `gh auth token`.
- `tests/__snapshots__/*.animated.svg` — 8 fixtures × 1 animated variant = 8
  snapshot files regenerated. Reduced snapshots unchanged (no comet animation
  in reduced mode).
- `.gitignore` — add `experiments/` and `prototypes/v2-local/`.
- `specs/009-comet-tail/{spec,plan,tasks}.md` — the three required spec files.

## Changes — src/renderer.ts

### Head radii (15% shrink)

```ts
const COMET_NUCLEUS_R = 1.85;       // was 2.2
const COMET_COMA_INNER_R = 4.7;     // was 5.5
const COMET_COMA_OUTER_R = 7.65;    // was 9
```

### New tail constants

```ts
const COMET_TAIL_RX = 56;
const COMET_TAIL_RY = 3.0;
```

### Remove ghost-trail types

Delete `TrailParticle` interface + `COMET_TRAIL` array (~12 lines).

### Defs block — prepend tail gradient + blur filter

Before `<filter id="organic-sphere">`:

```xml
<linearGradient id="tail-grad" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0%"   stop-color="#c8e0ff" stop-opacity="0"/>
  <stop offset="40%"  stop-color="#c8e0ff" stop-opacity="0.1"/>
  <stop offset="70%"  stop-color="#d8ecff" stop-opacity="0.5"/>
  <stop offset="90%"  stop-color="#ffffff" stop-opacity="0.85"/>
  <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
</linearGradient>
<filter id="tail-blur" x="-20%" y="-100%" width="140%" height="300%">
  <feGaussianBlur stdDeviation="1.2"/>
</filter>
```

### renderComet() — replace ghost loop with ellipse emit

Before:

```ts
// Trail (rendered first so head/coma paint over it)
for (const particle of COMET_TRAIL) {
  out += emitCometLayer(particle.radius, theme.cometTrail, particle.opacity, particle.beginOffsetS);
}
```

After:

```ts
// Tail: single gradient ellipse with rotate="auto" so the gradient tracks
// the path tangent. Rendered first so head/coma paint over it.
const tailDur = `dur="${cycleS.toFixed(2)}s"`;
out +=
  `<ellipse cx="-${COMET_TAIL_RX}" cy="0" rx="${COMET_TAIL_RX}" ry="${COMET_TAIL_RY.toFixed(2)}" fill="url(#tail-grad)" filter="url(#tail-blur)">` +
  `<animateMotion ${tailDur} begin="0s" repeatCount="indefinite" keyTimes="${motionKeyTimes}" keyPoints="${motionKeyPoints}" calcMode="linear" rotate="auto" path="${pathD}" />` +
  `<animate attributeName="opacity" ${tailDur} begin="0s" repeatCount="indefinite" keyTimes="${opacityKeyTimes}" values="1;1;0;0" />` +
  `</ellipse>`;
```

### Keep

- Coma (outer + inner) and nucleus — unchanged logic, new smaller radii.
- `emitCometLayer` helper — still used for head.
- Constellation path, bg stars, peaks — untouched.
- Early return for `!animated` and `peaks.length < 2` — both preserved.

## Verification steps

1. `pnpm run build:renderer` — emits updated dist-renderer/.
2. `UPDATE_SNAPSHOTS=1 pnpm test` — regenerates snapshots.
3. Spot-check one animated snapshot (e.g. `kiaquila.animated.svg`):
   - Contains `<ellipse cx="-56" cy="0" rx="56" ry="3.00" fill="url(#tail-grad)" filter="url(#tail-blur)">`.
   - Contains exactly 1 `<ellipse>` (was 0 before).
   - Contains 3 `<animateMotion>` instead of 7 (1 ellipse + 1 coma inner + 1 coma outer + 1 nucleus = 4... actually coma outer + coma inner + nucleus + ellipse = 4). Baseline had 7 (4 ghosts + coma inner + coma outer + nucleus).
4. Re-run `UPDATE_SNAPSHOTS=1` once and confirm second run is identical (deterministic).
5. `pnpm run ci` — full local reproduction of CI pipeline.

## Risk assessment

| risk | mitigation |
|---|---|
| `rotate="auto"` rendering inconsistency in rare browsers | Supported in all current Chromium/WebKit/Gecko; GitHub's camo renders via OS SVG engine which is one of these. Low real-world risk. |
| Gradient id collision if multiple SVGs inlined on same page | Production path is `<img>` — each SVG is isolated. No risk for shipped flow. |
| Tail clips at viewBox edges when comet near left boundary | Fade-to-transparent left end of gradient hides clipping artifact. Acceptable. |
| Unused `theme.cometTrail` field now | Left in `Theme` interface to avoid breaking consumers. Mark as deprecated in a follow-up if it matters. |

## Non-goals for this PR

- Removing `theme.cometTrail` from `Theme` interface (separate cleanup).
- Adding bcherny to snapshot-test fixtures list (optional; fixture file itself is enough for future rendering runs).
- Adjusting traversal timing (`COMET_TRAVERSAL_MS`) — unchanged.
- Deleting `experiments/comet-tail/` — gitignored, keep as local scaffold for future experiments.
