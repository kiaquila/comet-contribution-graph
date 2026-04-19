# comet-contribution-graph

A cinematic GitHub contribution graph. A comet traces your most productive days across a constellation of your year.

**Status:** Work in progress — private preview. An initial public release with a GitHub Action and install instructions will follow once the first version is ready.

## Concept

- Preserves the familiar 7×53 contribution grid for legibility (weekday rows + month labels).
- Your top productive days are highlighted as golden stars.
- A comet flies through them chronologically, leaving a glowing trail.
- Inactive cells fade into a deep night sky; a soft layer of background stars adds atmosphere.

## Current state

- `prototypes/variant-d-grid-peaks.html` — standalone HTML prototype with fake realistic data. Open in a browser to preview.
- No product `index.html` yet — the prototype is the working artifact.
- Final deliverable: a published GitHub Action that renders the graph as SVG, embeddable in any user's README. Vercel hosts a preview of the prototype during development.

## Stack

- Static prototype (HTML + CSS + inline JS, single file)
- Fonts: Space Mono via Google Fonts (CDN)
- Build: `scripts/build-static.mjs` copies the active prototype to `dist/index.html` for preview
- Hosting (preview): Vercel (Git integration, preview deploys per PR)
- CI: GitHub Actions (`baseline-checks`, `guard`, `AI Review`)

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
├── prototypes/                  # Standalone HTML prototypes
│   └── variant-d-grid-peaks.html
├── scripts/                     # Build and orchestration helpers
├── tests/                       # Node test suites
├── specs/<feature-id>/          # Per-feature spec.md / plan.md / tasks.md
├── docs_comet/                  # Durable docs, ADRs, devops contracts
├── .specify/memory/             # Constitution and process rules
├── .github/workflows/           # CI, guard, AI review, OSV scan
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
