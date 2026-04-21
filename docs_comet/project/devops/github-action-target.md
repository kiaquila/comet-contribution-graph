# GitHub Action Target

> Audience: all agents (Claude, Codex, Gemini) and the repo owner. This is the durable source of truth for the Action deliverable: goal, architecture, 4-PR roadmap, and fixed design decisions. When starting any PR in the sequence below, read this file first plus the matching `specs/<id>/`. Update this doc whenever a roadmap PR merges or a fixed decision changes.

## Goal

Publish a public GitHub Action that any developer installs in their profile repo to render a cinematic contribution graph — a comet traces a path across constellation-like peaks of their most productive days, with a starry-sky background. The generated animated SVG is embedded in the profile README (the "About me" card), in the spirit of [Platane/snk](https://github.com/Platane/snk).

## Status (2026-04-21)

- Prototype (`prototypes/variant-d-grid-peaks.html`) — shipped, polished, on Vercel preview (PR #2 merged).
- CI infra (ESLint, html-validate, feature-memory gate, Playwright smoke, Codex review) — green (PR #4 merged).
- PR 002 — renderer extraction — merged. Pure-TS SVG renderer, SMIL animation, snapshot tests.
- PR 003 — data layer — merged. GraphQL `contributionsCollection` fetcher + parser, 43 tests.
- **PR 004 — Action entrypoint — in review.** `action.yml` + `src/action.ts` + `@vercel/ncc` bundle in `dist-action/` + orphan force-push. All local checks green.
- PR 005 — not started; spec not yet written (see "Forward-referencing specs" below).

### Closed-in-PR-002 scope

- TypeScript toolchain (`tsconfig.json`, strict mode, `tsc --noEmit` in CI, `check:ts` script).
- Pure-TS renderer module: `src/{renderer,normalize,themes,prng,types}.ts` — no DOM, no browser APIs.
- SMIL animation migration (twinkle, halo-pulse, comet `<animateMotion>` with multi-layer coma + lagging-particles trail).
- Percentile-based peak selection with `[2,7]` clamp; empty-year and single-day edge cases.
- Month labels (Jan–Dec) and weekday labels (Mon/Wed/Fri) emitted as `<text>` inside SVG.
- 5 deterministic fixtures (`tests/fixtures/*.json`) + 10 snapshot baselines + `tests/normalize.test.mjs` (peak clamping, date-order, intensity).
- `scripts/build-fixtures.mjs` (one-shot fixture generator) and `scripts/render-sample.mjs [fixture]` (manual browser check).
- Light theme evaluated and intentionally dropped (see fixed-decisions table).
- Comet redesigned from single white dot to 9-element stack: nucleus + 2 coma layers + 4 trail particles.

### Still to do inside PR 002 (before merge)

- Codex review cycles to convergence (historical: 3–6 rounds on L-size PRs).
- Any visual tweaks surfaced by reviewers or Vercel preview comparison.
- Vercel preview green on prototype (prototype unchanged, expect no-op).

## 4-PR roadmap to MVP

| #   | Spec                                                                      | Size | What lands                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 002 | [specs/002-renderer-extraction/](../../../specs/002-renderer-extraction/) | L    | Pure TS SVG renderer (`src/renderer.ts`, `normalize.ts`, `themes.ts`, `prng.ts`), TypeScript toolchain, SMIL animation migration, snapshot tests against fixture profiles. Prototype untouched.      |
| 003 | `specs/003-data-layer/` (created when PR 002 merges)                      | M    | `src/data.ts` — GraphQL `contributionsCollection` fetcher + parser, fixture JSON files, CLI `scripts/fetch-contributions.mjs` for manual real-data verification.                                     |
| 004 | [specs/004-action-entrypoint/](../../../specs/004-action-entrypoint/)     | L    | `action.yml` + `src/action.ts` + `@vercel/ncc` bundle in `dist-action/` + orphan force-push to `comet-graph` branch. CI "dist up-to-date" check. `.gitattributes linguist-generated`. **In review.** |
| 005 | `specs/005-dogfood/` (created when PR 004 merges)                         | S    | `.github/workflows/comet-graph.yml` (weekly cron + `workflow_dispatch`), README overhaul with `<img>` embed (optional `<picture>` for reduced-motion fallback), usage docs for external users.       |

**Why 4 PRs, not 3 or 5.** Three would combine TypeScript toolchain, rendering, GraphQL, and normalization in one PR — too broad for Codex review (historical data: 6 cycles on L-size PRs). Five would split normalization away from its only consumer (the renderer), violating the CLAUDE.md "no abstractions for single-use" rule.

### Forward-referencing specs

Specs for PR 003/004/005 are intentionally NOT written yet. Their scope will be refined by what we learn shipping PR 002 (actual SMIL behavior through camo, snapshot testing ergonomics, TS build quirks). Writing them now would be premature — they would rot before execution. Create each spec when its PR begins.

## Fixed design decisions (user-approved 2026-04-20)

These are load-bearing across all four PRs. Do not re-open unless the user reopens.

| Decision                      | Value                                         | Why                                                                                                                                                       |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Font                          | system `monospace`                            | SVG via `<img>` cannot load external fonts; base64 embed adds ~80KB/file; `<path>` glyphs are brittle.                                                    |
| Comet traversal duration      | 4800 ms                                       | Designer rec — cinematic pacing for infinite README loop; 3.36s (prototype) felt hectic.                                                                  |
| Inter-cycle hold              | 3500 ms                                       | "Breathe out" pause; 1.5s (prototype) felt nervous when looping forever.                                                                                  |
| Background twinkle period     | 7 s                                           | Below the 3–8 flashes/min "alarm flash" threshold.                                                                                                        |
| Halo-pulse period (peaks)     | 3 s                                           | Visible without alarm mood.                                                                                                                               |
| Halo-pulse stagger            | 0.6 s per peak (negative `begin`)             | Natural desync between peaks.                                                                                                                             |
| Top-K peaks (comet waypoints) | hardcoded 7, clamp `[2, 7]`                   | No input in MVP — `top_n` Action input deferred until a 2nd real need.                                                                                    |
| Empty-year behavior           | stars-only sky, no comet                      | Edge case: new accounts / 0-contribution years.                                                                                                           |
| Output branch name            | `comet-graph`                                 | Dedicated orphan branch, force-pushed each run. README refs `raw.githubusercontent.com/USER/USER/comet-graph/comet.svg` (+ optional `comet-reduced.svg`). |
| Light theme                   | dropped                                       | Starry sky is by definition dark — a "light" variant breaks the product metaphor. Dark-only ships in MVP; added 2026-04-20 after user review.             |
| Color normalization           | percentile-based over user's own distribution | CLAUDE.md product rule: never absolute thresholds.                                                                                                        |

## Deferred post-MVP

| Item                                                | Why deferred                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GIF output                                          | Requires Puppeteer (~150MB Docker overhead); SVG works in GitHub README — GIF only needed for external platforms (email, RSS). Add if requested.              |
| Marketplace listing                                 | MVP = public repo + tag `v1`, users reference `owner/comet-contribution-graph@v1`. Marketplace listing is ~30min of work — do after dogfood proves stability. |
| Playground / landing page                           | README + demo SVG + YAML snippet = 80% of a landing's value. Build the playground once the Action produces quality artifacts for real users.                  |
| Cross-user support                                  | Action initially ships with `${{ github.token }}` reading the repo owner's own contributions. PAT input for querying other users — add on request.            |
| Comet trail "grow-then-shrink" dashoffset animation | No clean SMIL equivalent. MVP renders static constellation path + animated head only.                                                                         |

## Architecture contract

### Data source

GitHub GraphQL API: `user(login: $login) { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount color } } } } }`. Default auth: `${{ github.token }}` (reads owner's own contributions). PAT with `read:user` scope for cross-user queries — post-MVP.

### Rendering

Pure TypeScript in `src/renderer.ts` → SVG string. No DOM, no `document`, no `requestAnimationFrame`, no `canvas`. Runs on Node 20 stdlib only. Deterministic for a given `(data, options, seed)` tuple.

### Animation

**SMIL** (`<animate>`, `<animateMotion>`, `<animateTransform>`). Rationale: CSS `@keyframes` in SVG through GitHub's camo proxy in `<img>` context is unreliable in Safari; `<script>` in SVG via `<img>` does not execute at all. SMIL is the only cross-browser path that works through camo.

### Theming

Single SVG artifact `comet.svg`, dark-only. Starry-sky aesthetic is inherent to the product, so a light variant is intentionally NOT produced. README embed is a plain `<img>`:

```markdown
![cinematic comet contribution graph](https://raw.githubusercontent.com/USER/USER/comet-graph/comet.svg)
```

A second artifact — `comet-reduced.svg` — is a static variant (no `<animate>` elements) for users who want a `prefers-reduced-motion` fallback via `<picture>`:

```markdown
<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="https://raw.githubusercontent.com/USER/USER/comet-graph/comet-reduced.svg" />
  <img alt="cinematic comet contribution graph" src="https://raw.githubusercontent.com/USER/USER/comet-graph/comet.svg" />
</picture>
```

### Deploy

GitHub Action (`action.yml`, `runs.main: dist-action/index.js`) → orphan force-push to `comet-graph` branch containing only the generated SVG files. `dist-action/index.js` is a committed `@vercel/ncc` single-file bundle; `dist-action/** linguist-generated=true -diff` in `.gitattributes` collapses it in PR diff view. README references stable `raw.githubusercontent.com` URLs.

### Cache behavior

`raw.githubusercontent.com` + camo TTL ~5 minutes. For forced refresh users can append `?v=<timestamp>` or run [kevincobain2000/action-camo-purge](https://github.com/kevincobain2000/action-camo-purge).

## Action inputs (final shape, subject to MVP validation)

| Input      | Required | Default               | Description                                                            |
| ---------- | -------- | --------------------- | ---------------------------------------------------------------------- |
| `username` | yes      | —                     | GitHub login to render the graph for                                   |
| `token`    | no       | `${{ github.token }}` | Token used for GraphQL API; PAT needed for cross-user                  |
| `reduced`  | no       | `true`                | Whether to emit `comet-reduced.svg` as a companion to the animated one |
| `branch`   | no       | `comet-graph`         | Output branch                                                          |

`top_n`, `seed`, animation timing inputs are intentionally NOT exposed in MVP — hardcoded per fixed-decisions table. Add inputs when a second real use case appears. `theme` input was removed before MVP — only dark theme is produced.

## Handoff protocol for future sessions

When starting PR 003, 004, or 005 in a fresh chat/agent session, paste this:

> Read `docs_comet/project/devops/github-action-target.md` and `specs/00N-.../` — we are starting PR 00N. Follow the PR loop in `docs_comet/project/devops/ai-pr-workflow.md` and the review contract in `docs_comet/project/devops/review-contract.md`.

That gives any agent (Claude / Codex / Gemini) the full roadmap, fixed decisions, deferred list, and per-PR scope without relying on per-agent session memory.

## Related docs

- Product idea: [project-idea.md](../../project-idea.md)
- Frontend: [frontend-docs.md](../frontend/frontend-docs.md)
- AI orchestration: [ai-orchestration-protocol.md](ai-orchestration-protocol.md)
- PR loop: [ai-pr-workflow.md](ai-pr-workflow.md)
- Review contract: [review-contract.md](review-contract.md)
- Delivery playbook: [delivery-playbook.md](delivery-playbook.md)
- Vercel CD: [vercel-cd.md](vercel-cd.md)
