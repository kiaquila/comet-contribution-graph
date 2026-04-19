# Gemini Review Style Guide

Prioritize:

- contribution data accuracy (7×53 grid, week alignment, top-N peak day selection)
- animation correctness and performance (comet path interpolation, GPU-friendly transforms, `prefers-reduced-motion` fallback)
- SVG output stability across renderers (browser, future GitHub Action embed)
- accessibility (color contrast, no seizure-risk effects, alt/aria for static fallback)
- bundle size and SSR-compatibility for the future GitHub Action artifact
- CDN dependency risks (Google Fonts, future libs)
- maintainability of SVG generation code

Do not block on style-only nitpicks.
