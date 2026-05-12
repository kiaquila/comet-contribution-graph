# AGENTS.md — comet-contribution-graph

> Universal onboarding document for any AI agent (Claude Code, Codex, Gemini CLI, Cursor, etc.)

## What Is comet-contribution-graph?

**comet-contribution-graph** is a cinematic GitHub contribution graph renderer.
It presents the familiar 7×53 grid (weekday rows, month labels) with a dramatic
visual treatment:

- **Top productive days** are highlighted as golden stars
- A **comet** flies through those stars chronologically, leaving a glowing trail
- **Inactive cells** fade into a deep night sky palette
- A **soft background star layer** adds atmosphere

**Current implementation:** TypeScript SVG renderer + GitHub Action, with the
original standalone prototype retained under `prototypes/`
**Font:** Space Mono via Google Fonts CDN in the browser prototype; generated
SVG output uses repository-owned renderer styles
**Deploy target:** GitHub Action package for user profile repos; Vercel remains
available for prototype previews
**Owner:** kiaquila — personal project

## Current Phase & Status

| Area                                      | Status                                              |
| ----------------------------------------- | --------------------------------------------------- |
| Product prototype                         | COMPLETE, retained for visual reference             |
| Real GitHub data wiring                   | COMPLETE via GitHub GraphQL data layer              |
| SVG generator (Node-compatible)           | COMPLETE in `src/renderer.ts`                       |
| GitHub Action packaging                   | COMPLETE via `action.yml` and `dist-action/`        |
| Repository memory and feature-memory flow | ACTIVE, enforced by guard and specs folders         |
| CI / AI review orchestration              | ACTIVE, with Unicorn Hub parity work in progress    |
| Production deploy flow                    | GitHub Action package; Vercel preview for prototype |

## Project Structure

```
comet-contribution-graph/
├── .specify/
│   └── memory/constitution.md          # Process contract and non-negotiable rules
├── specs/
│   └── <feature-id>/                   # Feature memory: spec.md, plan.md, tasks.md
├── prototypes/
│   ├── variant-d-grid-peaks.html       # Original standalone prototype
│   └── variant-d-real-history.html     # Browser prototype with real-history sample flow
├── src/
│   ├── action.ts                       # GitHub Action entrypoint
│   ├── data.ts                         # GitHub GraphQL contribution fetcher
│   ├── normalize.ts                    # Calendar normalization
│   └── renderer.ts                     # Node-compatible SVG renderer
├── tests/                              # Node test suite and SVG snapshots
├── dist-action/                        # Bundled Action output checked into git
├── package.json                        # Repo tooling for CI, local orchestration, and build
├── action.yml                          # Published GitHub Action contract
├── vercel.json                         # Vercel preview/output configuration
├── scripts/
│   ├── build-static.mjs                # Static preview build to dist/
│   ├── check-static-baseline.mjs       # Repository baseline checks
│   ├── check-feature-memory.mjs        # Product change -> complete specs folder enforcement
│   ├── check-dist.mjs                  # Bundled Action artifact verification
│   ├── fetch-contributions.mjs         # Local GraphQL sample fetch helper
│   ├── render-sample.mjs               # Local SVG sample renderer
│   ├── set-implementation-agent.mjs    # Local + GitHub agent policy helper
│   ├── new-worktree.mjs                # macOS local worktree helper
│   ├── start-implementation-worker.mjs # Prompt preparation helper
│   ├── publish-branch.mjs              # Push branch and open or reuse PR
│   ├── resolve-pr-context.mjs          # Pull request context resolver for workflows
│   ├── ai-review-gate.mjs              # Review gate for Codex/Claude/Gemini
│   └── switch-review-agent.mjs         # One-shot review backend switcher
├── docs_comet/
│   ├── README.md                       # Durable docs index
│   ├── adr/                            # Architecture decision records
│   ├── project-idea.md                 # Product overview and roadmap
│   └── project/
│       ├── frontend/frontend-docs.md   # Prototype architecture, animation, constraints
│       └── devops/                     # CI/CD and orchestration contract
└── .github/workflows/                  # CI, guard, AI review, Claude, deploy policy
```

## Delivery Workflow

- All code changes land through pull requests.
- Product-code work starts from an active `specs/<feature-id>/` folder.
- One implementation loop uses one worktree, one branch, and one PR.
- Required GitHub checks are `baseline-checks`, `guard`, and `AI Review`.
- `osv-scan` runs as a supply-chain security check and may become required
  once branch protection is applied.
- Vercel handles prototype preview deployments for pull requests and `main`
  through Git integration (see `docs_comet/project/devops/vercel-cd.md`).
- The user-facing deliverable is the GitHub Action described by `action.yml`
  and bundled under `dist-action/`.
- Durable workflow docs live under `docs_comet/project/devops/`.
- Local orchestration state lives under `.claude/` and is gitignored.
- Local worktrees are created inside `<repoRoot>/.claude/worktrees/<slug>/` so they stay inside the repository.
- Agent selection is policy-driven through repository variables:
  - `AI_IMPLEMENTATION_AGENT`
  - `AI_REVIEW_AGENT`
- Default policy for this repository is:
  - implementation: `claude`
  - review: `codex` (see `docs_comet/project/devops/ai-orchestration-protocol.md` for the canonical description)
- Claude is the default implementation agent because it owns architecture, orchestration, CI/CD health, and repository memory, and is driven from the user's local Claude Code terminal session.
- Codex is the current default review backend via `@codex review` triggers on PR comments.
- Gemini review stays wired via Gemini Code Assist GitHub App; switch with `pnpm run review:switch -- --to gemini`.
- Claude review workflow (`claude-review.yml`) is **currently non-operational** (dead code pending cleanup PR; no `ANTHROPIC_API_KEY` configured, local runner rolled back).

## Review Guidelines

- Gemini review uses native GitHub PR review output from `gemini-code-assist[bot]` plus inline severity markers such as `Critical`, `High`, `Medium`, and `Low`.
- Codex review uses native GitHub PR review output plus `P0-P3` inline severity badges.
- Claude review uses a top-level `claude[bot]` comment with marker lines, not a formal GitHub PR review.
- When a Claude review request includes `AI_REVIEW_AGENT`, `AI_REVIEW_SHA`, and `AI_REVIEW_OUTCOME`, preserve those lines exactly at the start of the final top-level Claude comment.
- `AI_REVIEW_OUTCOME=pass` means no material findings.
- `AI_REVIEW_OUTCOME=advisory` means advisory-only findings that should not block merge.
- `AI_REVIEW_OUTCOME=block` means at least one finding should block merge.

## Key Rules

### 1. Repository is the source of truth

No direct production edits in Vercel or the browser. Product changes must be made in git, reviewed in a PR, and deployed from the reviewed branch or merge commit.

### 2. Keep durable docs in sync

When updating `prototypes/`, `src/`, runtime behavior, workflows, or deploy
configuration, update the active `specs/<feature-id>/` folder and at least one
relevant durable doc under `docs_comet/`, `AGENTS.md`, or `CLAUDE.md`.

### 3. Preserve deployability

Changes must keep the prototype or future build output producing a deployable
artifact. Do not break `pnpm run build` once a build step is introduced.

### 4. One worker equals one worktree

Do not run parallel implementation work in the main checkout. Worktrees live
under `<repoRoot>/.claude/worktrees/<slug>/` and are created via
`scripts/new-worktree.mjs`. Local orchestration state is gitignored under
`.claude/`.

### 5. Gemini review config is repository-owned

Gemini review behavior is configured through `.gemini/config.yaml` and
`.gemini/styleguide.md`. Keep those files in sync with the repository review
contract.

### 6. Keep the SVG generator Node-compatible

Any rendering code that is intended to run in the GitHub Action must not use
browser-only APIs. Enforce this separation: data layer + SVG generator = Node;
animation overlay = browser-only optional layer.

### 7. Propose orchestration before non-trivial tasks

Before a non-trivial task (multi-file change, refactor, research, verification loop, parallelizable work, unclear-cause debugging), propose the best-fit orchestration capability available to you in one short sentence with justification. Wait for user consent. Skip for trivial tasks (rename, one-line fix, quick question).

Claude Code specifics (OMC modes, subagents): see `CLAUDE.md § OMC orchestration`.
Codex / Gemini / other agents: propose your equivalent capabilities (planning modes, parallel runners, review councils) before starting.

### 8. Always verify active branch and target refs before answering repo-state questions

Before answering questions about repository status, PR state, review outcomes, or
workflow behavior:

- verify the current checkout branch and cleanliness (`git branch --show-current`,
  `git status --short --branch`)
- verify target refs directly (`origin/main` and the relevant PR head ref/SHA)
- do not rely on stale local branches as evidence for current repository truth

## Reading Route — Implementing a Change

This is the canonical reading order. `docs_comet/README.md` is a topical index (grouped by theme), not a reading order — defer to this list.

1. `.specify/memory/constitution.md` — non-negotiable process rules
2. `docs_comet/project-idea.md` — product facts (graph dimensions, concept, roadmap)
3. `docs_comet/project/frontend/frontend-docs.md` — prototype architecture, animation, constraints
4. `docs_comet/project/devops/ai-orchestration-protocol.md` — agent routing, default policy, review backends
5. `docs_comet/project/devops/ai-pr-workflow.md` — PR gates and merge rules
6. `docs_comet/project/devops/review-contract.md` — what each review backend produces
7. `docs_comet/project/devops/review-trigger-automation.md` — why bot-posted triggers are rejected, active Tier 1
8. `docs_comet/project/devops/unicorn-hub-adoption.md` — adopted vs skipped blueprint pieces
9. `docs_comet/project/devops/delivery-playbook.md` — preview + production smoke
10. `docs_comet/project/devops/vercel-cd.md` — Vercel deploy contract (prototype preview infra)
11. `docs_comet/project/devops/github-action-target.md` — future Action deliverable and open questions
12. `specs/<feature-id>/spec.md`, `plan.md`, `tasks.md` — active feature
13. `prototypes/variant-d-grid-peaks.html` — current prototype
