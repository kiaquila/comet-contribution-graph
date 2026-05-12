# comet-contribution-graph

A cinematic GitHub contribution graph. A comet traces your most productive days across a constellation of your year.

## Current Stack

- Prototype: standalone HTML+CSS+inline-JS visual references under
  `prototypes/`
- Renderer: Node-compatible TypeScript SVG generation in `src/renderer.ts`
- Data layer: GitHub GraphQL contribution fetching in `src/data.ts`
- Action entrypoint: `src/action.ts`, bundled to `dist-action/` with ncc
- Package contract: `action.yml` publishes the profile-repo renderer Action
- Vercel Git integration for prototype preview deploys
- GitHub Actions for CI, guard, AI review orchestration, dogfood rendering, and
  OSV scanning
- Tests: Node test suite plus SVG snapshots under `tests/`
- `.specify/`, `docs_comet/`, and `specs/` as repository memory
- Codex as default review backend (see `docs_comet/project/devops/ai-orchestration-protocol.md`)

## Important Rules

- Source of truth is the repository, not manual edits in Vercel
- All changes go through PRs
- Product changes start from an active `specs/<feature-id>/` folder
- One implementation loop = one worktree, one branch, one PR
- When changing UI behavior, workflows, or build/deploy: update `specs/` and `docs_comet/`
- Never merge a PR until ALL checks complete (including `AI Review`), even if GitHub shows `MERGEABLE`/`UNSTABLE`. Wait until all checks are `COMPLETED` and `SUCCESSFUL`.
- Before each `git push`, run `pnpm run preflight` — it locally reproduces what the PR Guard and CI do (feature-memory gate + baseline + html + build + format + tests). Saves iterations on public checks.
- Commit-message style: subject only (≤72 chars, conventional prefix `fix:`/`chore:`/`docs:`/etc.); no body unless the "why" is non-obvious; long context goes in the PR description, not the commit body.
- Local pre-push hook: `.claude/hooks/check-feature-memory-on-push.sh` (registered in `.claude/settings.local.json` as PreToolUse on Bash) blocks `git push` if committed product-path changes require `specs/<id>/{spec,plan,tasks}.md` and the spec is missing. `.claude/` is gitignored — restore manually on a new machine. Emergency bypass: comment out the hook in `.claude/settings.local.json` or push from a plain terminal.
- Do not break deployability: the prototype must remain openable in a browser; once a build step exists, `pnpm run build` must produce a deployable artifact.
- When reviewing, focus on: contribution data correctness, animation/SVG performance, `prefers-reduced-motion` compliance, accessibility, bundle size for Action embed, and CDN supply-chain risks.
- Do not create abstractions for single-use logic. If a function is used in one place, it does not need configurability, a plugin interface, or generic parameters. Add generalization only when a second real consumer appears.
- For multi-step tasks without a dedicated spec (routine 3-5 steps: CDN update, single-module refactor, config migration): write out a plan first — `step -> verify-condition`. Do not proceed silently or spin up a full `/plan` for 3 steps.

## OMC orchestration (auto-routing)

Before executing a non-trivial task, assess whether an oh-my-claudecode (OMC) capability fits, and **propose the best-fit mode to the user in one short sentence with justification before starting**. Do not auto-launch — get consent first.

Triggers for "non-trivial" (at least one applies):

- Multi-file change, refactor, migration
- Research/search across the codebase where the answer is not obvious
- Task with a verification/QA cycle
- Parallelizable work (multiple independent subtasks)
- Long autonomous work ("don't stop until done")
- Debugging with unclear cause, tracing, multiple hypotheses

Mode map (abbreviated; full catalog in skill `omc-reference`):

- `/plan` — strategic planning for complex tasks
- `/ralph` — "don't stop until done", PRD-driven loop with verification
- `/ultrawork` — parallel execution of independent subtasks
- `/autopilot` — full cycle from idea to code
- `/team` — multiple coordinated agents on a shared task list
- `/trace`, `/debug` — evidence-chain diagnostics
- `/ask` — Claude/Codex/Gemini council
- subagents: `executor`, `architect`, `critic`, `code-reviewer`, `debugger`, `tracer`, `verifier`, `planner`, `security-reviewer`, `test-engineer`, `explorer`, `designer`, `writer`

Skip the proposal for trivial tasks (rename, one-line fix, quick question, fast status check). Do not add noise on small things — minimum-intervention principle.

## Documentation

- Process constitution: `.specify/memory/constitution.md`
- Docs map: `docs_comet/README.md`
- Product idea: `docs_comet/project-idea.md`
- Frontend: `docs_comet/project/frontend/frontend-docs.md`
- Orchestration: `docs_comet/project/devops/ai-orchestration-protocol.md`
- PR loop: `docs_comet/project/devops/ai-pr-workflow.md`
- Review contract: `docs_comet/project/devops/review-contract.md`
- Review trigger automation: `docs_comet/project/devops/review-trigger-automation.md`
- Delivery playbook: `docs_comet/project/devops/delivery-playbook.md`
- Vercel CD: `docs_comet/project/devops/vercel-cd.md`
- GitHub Action target: `docs_comet/project/devops/github-action-target.md`
- ADR index: `docs_comet/adr/README.md`
