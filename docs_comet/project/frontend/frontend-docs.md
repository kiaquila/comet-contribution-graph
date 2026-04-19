# Frontend Docs

> Audience: all agents. Canonical source for: prototype architecture, CSS grid approach, animation layer, build pipeline, accessibility constraints. Product facts (grid dimensions, concept) are in `docs_comet/project-idea.md`.

## Current Architecture

The prototype is a **single-file HTML document** with no build step:

- `prototypes/variant-d-grid-peaks.html` — self-contained: inline `<style>`, HTML markup, and inline `<script>`
- **Font:** Space Mono via Google Fonts CDN (`@import` in `<style>`)
- **Grid:** CSS-based layout mimicking an SVG-style 7×53 grid (weekday rows, month column labels); no actual `<svg>` element in the current prototype
- **Animation:** inline JavaScript driving CSS transitions/keyframes for the comet and glowing trail
- **Data:** hardcoded fake-realistic contribution counts; no external data fetch

No npm dependencies, no bundler, no framework. Open `prototypes/variant-d-grid-peaks.html` directly in a browser.

## Planned Migration Path

The prototype will be split into distinct layers as it matures toward the GitHub Action deliverable:

1. **Data layer extraction** — isolate contribution data fetching/formatting into a standalone module that works in Node.js (required for Action use)
2. **SVG generator** — replace or supplement the CSS grid with a proper SVG renderer; this module must work in Node.js without browser APIs (no `document`, no `window`, no `requestAnimationFrame`)
3. **Animation overlay** — keep browser-only animation logic (CSS transitions, JS timing) as a separate layer that wraps the static SVG; this layer is optional and skipped in Action/static output

This layering ensures the core rendering path is Action-compatible from the start.

## Known Constraints

- **`prefers-reduced-motion`:** the animation must respect `@media (prefers-reduced-motion: reduce)`. When the user has reduced motion enabled, the comet animation must not play; the static graph with highlighted stars must still render correctly.
- **GitHub README width:** the graph must render correctly at **672px** (the standard GitHub README content width). Test at this viewport before shipping any layout change.
- **Mobile:** the graph should remain legible on narrow viewports (≥375px). Column labels may be abbreviated or hidden on very small screens, but the grid cells must not overflow.
- **No browser-only APIs in the SVG generator:** `document`, `window`, `canvas`, and `requestAnimationFrame` are not available in Node.js. The SVG generator module must produce a string of valid SVG markup using only data manipulation and string templates.
- **Bundle size:** the GitHub Action artifact must be self-contained and reasonably sized. Avoid large runtime dependencies in the data/SVG layer; prefer lightweight or zero-dep approaches.
- **CDN supply-chain risk:** any CDN dependency (fonts, scripts) added to the prototype must be evaluated for SRI-pinning feasibility before it enters production. The current Space Mono Google Fonts import is prototype-only and will need to be replaced or bundled for Action output.

## Accessibility

- Grid cells should carry `aria-label` with the date and contribution count
- Comet animation region should be wrapped in `aria-hidden="true"` when purely decorative
- Respect `prefers-reduced-motion` via both CSS `@media` query and a JS guard for dynamically started animations
- Do not restrict viewport zoom (`user-scalable=no` must not be set)
