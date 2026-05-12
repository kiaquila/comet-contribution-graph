# comet-contribution-graph Process Constitution

## Purpose

This repository uses a lightweight spec-driven and AI-assisted delivery model.
The goal is to make frontend work resumable, reviewable, and safe to ship
through Vercel without relying on hidden session memory.

## Non-Negotiable Rules

1. Repository memory over session memory.
   Durable intent and operating rules live in `.specify/`, `docs_comet/`,
   `specs/`, workflows, and tests.
2. Specs before product code.
   Before changing the graph rendering behavior, SVG output contract, build
   contract, or deploy behavior, create or update one active `specs/<feature-id>/`
   folder with `spec.md`, `plan.md`, and `tasks.md`.
3. Pull requests only.
   Product changes land through pull requests with green required checks.
4. One worker, one worktree, one branch, one PR.
   Local implementation loops must run in isolated macOS worktrees instead of
   the main checkout.
5. Merge-ready means the full loop is green.
   A task is done only when the current PR head SHA has green
   `baseline-checks`, `guard`, and `AI Review`, no unresolved blocking review
   findings, and a healthy Vercel preview for the changed scope.
6. Production changes come from Git only.
   No direct edits in Vercel or the browser; production updates happen only
   through merge to `main` and Vercel Git integration.
7. Documentation moves with behavior.
   Changes to app behavior, orchestration, CI/CD, or architecture must update
   durable docs in the same PR.
8. Supervised verification evidence.
   Every product-code or control-plane PR must name goal, scope, acceptance
   criteria, negative scenarios, verification evidence, and process memory
   before merge. AI-written summaries do not replace evidence tied to the
   requested behavior.
9. Animation/SVG output stability.
   The graph must remain renderable as a static SVG (no-animation fallback for
   `prefers-reduced-motion`), keep the comet animation correct across all
   supported viewport widths, and preserve the GitHub Action artifact contract —
   the build must remain packageable as a GitHub Action that renders SVG without
   browser-only deps. Graph rendering must remain correct at GitHub README width
   (672px) and on mobile viewports.

## Memory Layers

- `.specify/`
  Process constitution and future reusable templates.
- `docs_comet/`
  Durable product, frontend, deployment, and orchestration context.
- `specs/<feature-id>/`
  Active feature intent, implementation plan, and execution state.

## Roles

- User
  Sets goals, approves product direction, and remains the final merge
  authority. Launches implementation loops from a local Claude Code terminal
  session.
- Claude
  Owns architecture, orchestration, CI/CD health, and repository memory, and
  is the default implementation agent. Runs from the user's local Claude Code
  terminal session and can dispatch other local agents via CLI when needed.
- Codex
  Current default review backend via `@codex review` on PR comments. See
  `docs_comet/project/devops/ai-orchestration-protocol.md` for the full routing
  contract.
- Gemini
  Alternative review backend via Gemini Code Assist GitHub App; switch with
  `pnpm run review:switch -- --to gemini`.
- GitHub Actions + Vercel
  Execute required checks, review normalization, previews, and production
  deployment.

## Standard Feature Loop

1. Sync from current `main`.
2. Create or update one active `specs/<feature-id>/` folder.
3. Select the implementation and review policy for the task.
4. Create an isolated macOS worktree and branch.
5. Generate the implementation prompt from repository memory.
6. Implement the scoped change on that branch only.
7. Update `tasks.md`, tests, and durable docs.
8. Open or update the same PR.
9. Wait for `baseline-checks`, `guard`, `AI Review`, and Vercel preview.
10. Iterate on the same branch until the PR is merge-ready.

## macOS Local Runner Contract

- Local orchestration is repository-owned. Helper scripts live in `scripts/`
  (`new-worktree.mjs`, `set-implementation-agent.mjs`,
  `start-implementation-worker.mjs`, `publish-branch.mjs`).
- Local agent selection state is stored under `.claude/` and is gitignored.
- Local worktrees are created inside `<repoRoot>/.claude/worktrees/<slug>/`
  so they stay inside the repository and do not pollute the user's
  `~/projects/` directory.
- Scripts may prepare prompts, worktrees, and PR publishing, but they must not
  bypass the PR loop or GitHub checks.
