# comet-contribution-graph

## Product Summary

`comet-contribution-graph` is a cinematic reimagining of the GitHub contribution
graph. It:

- Renders the familiar **7×53 grid** (weekday rows + month column labels) for legibility
- Highlights **top productive days as golden stars**
- Animates a **comet that flies through those stars chronologically**, leaving a glowing trail
- Fades inactive cells into a **deep night sky** palette
- Adds a **soft background star layer** for atmosphere

> This file is the canonical source of truth for product facts and roadmap. Other docs reference this.

## Current Product State

The current implementation is a **prototype only**:

- `prototypes/variant-d-grid-peaks.html` — standalone HTML mockup with fake realistic data
- Single-file HTML+CSS+inline-JS, no build step required to preview
- Font: Space Mono via Google Fonts CDN
- Grid rendered via CSS (SVG-style layout, not actual SVG)
- Animation implemented with inline JavaScript
- Open in any browser to preview; no server required

No real GitHub data is wired. No CI/CD or deployment is configured yet.

## Infra Goal

The repository will follow the standard delivery path once the prototype is
production-ready:

1. PR-only changes
2. Required checks in GitHub
3. AI review routing through repository policy (default: Codex; see `project/devops/ai-orchestration-protocol.md`)
4. Vercel preview deploys on PR (temporary prototype preview infra)
5. Vercel production deploys on merge to `main` (temporary; see `project/devops/vercel-cd.md`)
6. Repository memory through `.specify/`, `docs_comet/`, and `specs/`
7. Local macOS worktree orchestration for implementation tasks

## Next Product Goals

In priority order:

1. **Real GitHub data wiring** — replace fake data with live contribution data sourced from GitHub GraphQL API (authenticated) or `GITHUB_TOKEN` in Action context
2. **Action packaging** — extract the SVG generator into a Node-only module (no browser deps); package as a GitHub Action with inputs: `username`, `theme`, `top-n`
3. **Published Action** — publish to GitHub Marketplace so any user can embed the comet graph in their README via a one-step workflow addition
4. **Vercel-hosted demo** — public demo page at a stable URL showing the graph for a sample user, linked from the marketplace listing

See `project/devops/github-action-target.md` for the full Action deliverable spec.
