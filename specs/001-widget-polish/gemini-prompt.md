# Prompt for Gemini — cinematic contribution-graph widget, visual redo

Copy-paste this prompt to Gemini (`/ask gemini` via OMC, Gemini web, or Gemini API). The prompt is self-contained — Gemini has no prior context.

---

## ROLE

You are a senior front-end designer-developer. I need you to **redesign the visual rendering** of an SVG contribution-graph widget. A previous Claude attempt produced technically-correct code that reads as visually flat / generic. Your job is to deliver a fresh, more evocative visual treatment — and the single-file HTML that implements it.

## PRODUCT

`comet-contribution-graph` — a cinematic replacement for GitHub's green contribution squares. A public GitHub Action (future) will embed this widget into a user's README. The core idea: a year of daily commits rendered as a **night sky constellation**. The 7 most active days of the year are "peaks", connected by a **comet trace** sweeping across them. Everything else reads as background starlight whose brightness/size encodes daily contribution volume.

Key stylistic anchors:

- Deep-navy background already set (`#010209` base + subtle radial gradients toward `#1a2a4a` and `#2a1a3a`).
- `Space Mono` is the only font (already loaded via Google Fonts CDN).
- Grid: 53 weeks × 7 days = 371 cells. Fixed cellSize 16 px. Day-of-week rows must remain legible (Mon/Wed/Fri labels exist in DOM).

## THE FOUR REQUIREMENTS (first polish pass)

1. **Comet, not a snake.** The comet must feel like an astronomical object — a bright point-like head streaks across the sky, leaving a trail that fades to transparent down its length. Current implementation feels like a uniform stroke being drawn on a rail.
2. **Varied stars.** Each day's "star" has size and brightness driven by commit count, on a **continuous** scale (not 3 buckets). The 7 peak days should themselves differentiate — the brightest peak must visually dominate the dimmest peak. Equal counts ⇒ identical stars. Consider subtle shape variation (crosses / diffraction spikes / tiny 5-pt stars) so the field doesn't read as pure circles.
3. **Natural positioning.** Stars must NOT all pin to dead cell centers — jitter each inside its cell so the grid structure dissolves visually while day-of-week rows stay readable. Reproducible per seed (deterministic PRNG already wired as `rng()` seeded to `124`).
4. **Accessibility.** `role="img"` + `<title>` + `<desc>` on the SVG, wrapper `aria-label`. All animations must freeze under `prefers-reduced-motion: reduce`. WCAG AA contrast preserved.

## CURRENT STATE (what we already have — and why it's insufficient)

- File: `prototypes/variant-d-grid-peaks.html` — single HTML file, inline `<style>` + inline `<script>`, no framework, no bundler.
- A previous implementation pass:
  - Added CSS variables for comet duration (2.6 s), hold (0.9 s), head radius (4 px), jitter amp (0.32 × cellSize).
  - Rebuilt the comet as a separate `<circle id="comet-head">` + a gradient-stroke trail path, animated via `requestAnimationFrame` + `getPointAtLength` sampling.
  - Replaced 3-bucket radius/fill with continuous formulas: non-peaks `r = clamp(0.8 + count*0.22, 0.8, 3.0)`, HSL-lerp blue fill; peaks `r = 3.6 + (count-15)*0.35`, gold lightness ramp 68→86 %.
  - Added 4-armed diffraction spikes (two `<line>` elements) on all peaks and ~30 % of high-count non-peaks.
  - Jitter: `jx, jy = (rng()*2-1) * 0.32 * cellSize`.
  - A11y: `<section aria-label>` wrapper + SVG `role="img"` + `<title>` + `<desc>` + reduced-motion freezes.
- **The visual result reads as "nothing changed"** to the user. Technical correctness is there, but the scene does not feel cinematic. The comet still reads as a glowing stroke more than a streaking body. The stars still read as decorative dots more than a sky. The jitter is present but not magical.

The prior implementation file is included as a reference below — **do not merely tune its numbers**. Propose a fresh approach where needed.

## YOUR TASK

Produce **a complete replacement** for `prototypes/variant-d-grid-peaks.html` that makes the widget feel cinematic. You may:

- Use entirely different SVG structures, filters, masks, gradients, animation techniques.
- Introduce procedural background (nebula wash, milky-way band, faint star-field noise at sub-pixel scale).
- Use SVG `<filter>` compositions (turbulence, displacement, gaussian blur, lighting) for realistic twinkle + glow.
- Use CSS `offset-path`, `mix-blend-mode`, `backdrop-filter` where supported.
- Add a second layer of stars at varied z-depth (parallax via slight per-group translate + scale + opacity).
- Render the comet head as a composited shape (bright core + cool halo + sharp spike flares) rather than a plain white circle.
- Animate the trail's opacity along its length with a gradient that **actually follows the head**, not a linear gradient with static endpoints.
- Introduce subtle motion on background stars (drift + parallax) with a strict reduced-motion kill-switch.

You may NOT:

- Add external dependencies or additional CDN requests. Google Fonts (Space Mono) stays the only network resource.
- Break deterministic rendering for a given seed (`seed = 124`). The PRNG is a mulberry32 variant; reuse it.
- Break `prefers-reduced-motion`. Every new animation needs a static freeze frame.
- Inflate the SVG node count beyond ~800 without justification.
- Require a build step. Output must be a single `.html` openable directly in a browser.

## CONSTRAINTS — HARD

- **Single-file HTML**: inline `<style>` + inline `<script>` only.
- Background already established via `body` gradients — preserve or enhance, don't fight it.
- Grid geometry (53 × 7, cellSize 16, Mon/Wed/Fri labels, month labels along the top) must remain — this is still a contribution graph.
- Seeded PRNG deterministic; same RNG call order for a given day must yield the same star.
- Must remain embeddable in a README via a future GitHub Action that renders a PNG/SVG snapshot (so: no page-level layout that won't screenshot cleanly).

## DELIVERABLES

1. **Concept summary (≤ 200 words)** — what visual treatment you chose and why it beats the current implementation. Call out the 3–5 most impactful changes.
2. **Complete HTML file** — ready to save as `prototypes/variant-d-grid-peaks.html`. Include the inline `<style>` and inline `<script>` blocks. Preserve (or evolve) the existing data-generation structure (`371` days, `peakDays = [24, 75, 140, 195, 250, 310, 345]`, counts 1–5 background, 15–19 for peaks).
3. **A11y checklist** — confirm each of the 4 a11y requirements is met; list every animation + its reduced-motion freeze state.
4. **Risks / caveats** — any browser-support gotchas (especially Safari), perf concerns, or questions for the team.

## REFERENCE: full current prototype source

Read the current file at this repo location: `prototypes/variant-d-grid-peaks.html` (branch `widget-polish`, PR https://github.com/kiaquila/comet-contribution-graph/pull/2). If you cannot fetch the file, assume it matches the description in "CURRENT STATE" above — do not waste output reproducing the current code; **focus on what you would render instead**.

## TONE

Opinionated. Pick one cohesive visual direction and commit to it. If you hedge between two aesthetics, your result will feel like "nothing changed" again. The user's verbatim verdict on the last iteration: «Выглядит так как будто ничего не изменилось» — do better.
