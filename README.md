# comet-contribution-graph

A cinematic GitHub contribution graph. A comet traces your most productive days across a constellation of your year.

[![comet-graph](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/comet-graph.yml/badge.svg)](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/comet-graph.yml) [![OSV Scanner](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/osv-scan.yml/badge.svg)](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/osv-scan.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

![cinematic comet contribution graph](https://raw.githubusercontent.com/kiaquila/comet-contribution-graph/comet-graph/comet.svg)

## Usage

Add the following workflow to your profile repo (`<user>/<user>`) to render and publish your comet graph on a weekly schedule. The Action fetches your contribution data, renders the SVG, and force-pushes it to a `comet-graph` branch in the same repo.

```yaml
# .github/workflows/comet-graph.yml in <user>/<user>
name: comet-graph
on:
  schedule:
    - cron: "0 3 * * 1"
  workflow_dispatch:
jobs:
  render:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
      - uses: kiaquila/comet-contribution-graph@main
        with:
          username: <user>
```

`v1` tag coming post-MVP; pin to `@main` or a commit SHA for reproducibility.

### Embed in your profile README

```markdown
![cinematic comet contribution graph](https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet.svg)
```

### Reduced-motion fallback

For users who prefer reduced motion, serve the static companion SVG via a `<picture>` element:

```html
<picture>
  <source
    media="(prefers-reduced-motion: reduce)"
    srcset="
      https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet-reduced.svg
    "
  />
  <img
    alt="cinematic comet contribution graph"
    src="https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet.svg"
  />
</picture>
```

### Inputs

| name       | required | default               | description                                                                                                                                              |
| ---------- | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `username` | yes      | —                     | GitHub login to render the graph for                                                                                                                     |
| `token`    | no       | `${{ github.token }}` | Token with `contents:write` on the target repo; for cross-repo use a classic PAT with `repo` scope or a fine-grained PAT with `Contents: Read and write` |
| `reduced`  | no       | `"true"`              | Also emit `comet-reduced.svg` for `prefers-reduced-motion` fallback                                                                                      |
| `branch`   | no       | `"comet-graph"`       | Output branch; force-pushed on every run                                                                                                                 |

## How it works

Every run fetches your GitHub contributions via the GraphQL API, passes them through a pure-TS SVG renderer (SMIL-animated comet tracing your most productive days across a constellation of your year), and force-pushes the result to an orphan `comet-graph` branch in the repository where the workflow runs. Your profile README embeds the SVG via a stable `raw.githubusercontent.com` URL. See [github-action-target.md](./docs_comet/project/devops/github-action-target.md) for the architecture contract.

## Concept

- Preserves the familiar 7×53 contribution grid for legibility (weekday rows + month labels).
- Your top productive days are highlighted as golden stars.
- A comet flies through them chronologically, leaving a glowing trail.
- Inactive cells fade into a deep night sky; a soft layer of background stars adds atmosphere.

## Stack

- Node 20 GitHub Action, bundled single-file via `@vercel/ncc` (committed at `dist-action/index.js`)
- Pure-TypeScript SVG renderer (`src/renderer.ts`) with SMIL animation
- GitHub GraphQL `contributionsCollection` data source (`src/data.ts`)
- System `monospace` font (embed-safe, no CDN)
- Prototype (`prototypes/variant-d-grid-peaks.html`) — development preview, deployed to Vercel per-PR
- CI: GitHub Actions (`baseline-checks`, `guard`, `AI Review`, `OSV Scanner`, `comet-graph` dogfood)

## Getting started

This project uses **pnpm** (pinned via `packageManager` in `package.json`). The easiest way to get the right version is Node's built-in [`corepack`](https://nodejs.org/api/corepack.html):

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run build        # produce dist/index.html from the active prototype
pnpm run ci           # baseline + html-validate + build + prettier + tests
```

Open `prototypes/variant-d-grid-peaks.html` directly in a browser, or serve `dist/` with any static server to preview the build.

## Scripts

| Command                         | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `pnpm run build`                | Build static `dist/index.html` for Vercel preview      |
| `pnpm run check:repo`           | Repository baseline checks                             |
| `pnpm run check:html`           | HTML validation against the active prototype           |
| `pnpm run check:feature-memory` | Enforce `specs/<feature-id>/` for product changes      |
| `pnpm run check:ts`             | TypeScript strict-mode compile check                   |
| `pnpm run build:action`         | Produce `dist-action/index.js` via ncc                 |
| `pnpm run check:dist`           | Verify committed bundle matches source                 |
| `pnpm run format:check`         | Prettier check across tracked files                    |
| `pnpm run test`                 | Run Node test runner against `tests/`                  |
| `pnpm run ci`                   | Full local CI pipeline                                 |
| `pnpm run worktree:new`         | Create a new local worktree for an implementation loop |
| `pnpm run pr:publish`           | Push current branch and open/reuse a draft PR          |
| `pnpm run review:switch`        | Switch the active AI review backend                    |

## Supply chain

`pnpm-workspace.yaml` sets `minimumReleaseAge: 10080` (7 days, expressed in minutes). Any newly published version of a dependency — direct or transitive — must exist on the registry for at least 7 days before pnpm will install it. This reduces exposure to supply-chain attacks that rely on freshly published compromised versions being pulled in immediately.

Dependabot (`.github/dependabot.yml`) opens weekly PRs for npm and github-actions ecosystems with additional cooldown windows. OSV Scanner (`.github/workflows/osv-scan.yml`) runs on every push/PR and weekly against the OSV vulnerability database.

## Repository layout

```
comet-contribution-graph/
├── src/                         # Pure-TS Action: renderer, data, entry
├── dist-action/                 # Committed ncc bundle (Node 20 single-file)
├── prototypes/                  # Standalone HTML prototype
│   └── variant-d-grid-peaks.html
├── scripts/                     # Build and orchestration helpers
├── tests/                       # Node test suites + fixtures + snapshots
├── specs/<feature-id>/          # Per-feature spec.md / plan.md / tasks.md
├── docs_comet/                  # Durable docs, ADRs, devops contracts
├── .specify/memory/             # Constitution and process rules
├── .github/workflows/           # CI, guard, AI review, OSV scan, dogfood
├── action.yml                   # GitHub Action metadata
├── vercel.json                  # Vercel build/output configuration
└── AGENTS.md / CLAUDE.md        # Agent onboarding
```

## Workflow

- All changes land through pull requests — no direct edits to `main` or in Vercel.
- Product-code work starts from an active `specs/<feature-id>/` folder and runs in its own worktree / branch / PR.
- Required checks: `baseline-checks`, `guard`, `AI Review`.
- Agent policy is repository-driven via `AI_IMPLEMENTATION_AGENT` and `AI_REVIEW_AGENT` (defaults: `claude` for implementation, `codex` for review).

See [`AGENTS.md`](./AGENTS.md) for the full onboarding route and [`docs_comet/README.md`](./docs_comet/README.md) for the durable docs index.

## License

Released under the [MIT License](./LICENSE). © 2026 Kristina Aquila.
