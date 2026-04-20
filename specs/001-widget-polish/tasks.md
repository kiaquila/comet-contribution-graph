# Tasks — Widget polish: cinematic starry sky

## Design (designer subagent)

- [ ] Comet: choose traversal duration, easing, head size/colour, trail gradient method, loop pause
- [ ] Star radius curve (peaks + non-peaks)
- [ ] Star colour curve (yellow shades for peaks, blue shades for non-peaks)
- [ ] Shape mix ruleset (which stars get spikes / polygon)
- [ ] Jitter amplitude
- [ ] CSS variable names + default values

## Implementation (executor)

- [ ] Add CSS variables block at the top of `<style>`
- [ ] `starFor(d)` helper replaces current `if/else` ladder
- [ ] `jitter(cx, cy)` seeded from existing `rng()`; applied at data-generation step
- [ ] Shape renderer (circle vs. spike/polygon) via helper
- [ ] Comet refactor: head element + fading trail
- [ ] Comet animation: new duration/easing, reduced-motion guard updated
- [ ] A11y: `role="img"`, `<title>`, `<desc>`, `aria-label`, confirm header copy contrast
- [ ] Verify `prefers-reduced-motion` freezes every new animation

## Verification

- [ ] `pnpm run preflight` green
- [ ] Browser: normal motion — comet streaks fast, head visibly brighter than tail
- [ ] Browser: reduced-motion emulated — all animations static
- [ ] axe/Lighthouse scan — no critical a11y issues
- [ ] Equal-count peak days render identical stars; different-count peak days visibly differ
- [ ] No star pinned to dead cell center (unless RNG returns exact 0)
- [ ] Commit on branch `widget-polish`
- [ ] PR opened against `main`
- [ ] `@codex review` posted via gh CLI
- [ ] Required checks green (`baseline-checks`, `guard`, `AI Review`, Vercel preview)

## Out of scope (deferred)

- [ ] Replace prototype with product `index.html`
- [ ] Real GitHub GraphQL data
- [ ] Node-compatible SVG generator for Action
- [ ] Multi-variant theming
