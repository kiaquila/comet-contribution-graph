# Feature 000 — Bootstrap working environment

## Goal

Port the working environment (CI, docs, scripts, Vercel preview, AI review orchestration) from the sibling repo [pallete-maker](https://github.com/kiaquila/pallete-maker) to `comet-contribution-graph`, adapted for comet's product profile (prototype HTML → future GitHub Action).

## Why

Repo is bare (only README + one prototype HTML). Any product work needs the same PR-only delivery loop, AI review gate, feature-memory enforcement, and supply-chain guards that pallete-maker has. This PR establishes that baseline so subsequent PRs can focus on product code.

## Scope

**In scope**

- CI workflows (`baseline-checks`, `guard`, `AI Review`, OSV scan)
- Feature-memory enforcement (`scripts/check-feature-memory.mjs` + `specs/<feature-id>/`)
- Docs scaffolding under `docs_comet/` (mirrored from pallete-maker, adapted)
- `.specify/memory/constitution.md` adapted to comet's domain
- `AGENTS.md`, `CLAUDE.md`, revised `README.md`
- Orchestration scripts (`new-worktree`, `publish-branch`, `set-implementation-agent`, `switch-review-agent`, etc.)
- `package.json`, `pnpm-workspace.yaml` with `minimumReleaseAge: 10080`
- `vercel.json` with CSP tuned for comet's prototype (Google Fonts only)
- `.gemini/`, `.htmlvalidate.json`, `.gitignore`, `LICENSE`
- Dependabot + OSV scan security hardening
- Smoke tests under `tests/`

**Out of scope** (separate follow-up PRs)

- Promoting the prototype to a product `index.html`
- Real GitHub contribution data wiring (GraphQL API)
- Node-compatible SVG generator
- GitHub Action packaging (`action.yml`)
- Self-hosted review runners (rolled back in pallete-maker PR #9, not porting)

## Defaults

- `AI_IMPLEMENTATION_AGENT=claude`
- `AI_REVIEW_AGENT=codex` (switched from gemini in pallete-maker on 2026-04-17)

## Validation

- `pnpm install --frozen-lockfile` succeeds
- `pnpm run ci` green locally
- `node scripts/check-static-baseline.mjs` passes
- `node scripts/check-feature-memory.mjs origin/main HEAD` passes (this spec folder satisfies the gate)
- GitHub Actions `baseline-checks`, `guard`, `AI Review` green on PR
- Vercel preview deploy renders the prototype

## Acceptance

- All required files present per `scripts/check-static-baseline.mjs:requiredFiles`
- No `docs_pallete_maker`/`pallete-maker` leakage in comet repo except in citations of the template origin
- Default review agent is `codex` in both `ai-review-gate.mjs` and `ai-command-policy.yml`
- Repository stays deployable as static site via `pnpm run build`
