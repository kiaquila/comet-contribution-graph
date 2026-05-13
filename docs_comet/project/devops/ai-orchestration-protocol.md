# AI Orchestration Protocol

> Audience: all agents. **Canonical source** for: agent routing, default review backend, supported agents, review normalization. Other docs reference this. Prereq: `.specify/memory/constitution.md`. Next: `ai-pr-workflow.md`.

## Canonical Delivery Contract

`comet-contribution-graph` uses a PR-only delivery model.

Repository memory is split into:

- `.specify/` for process constitution
- `docs_comet/` for durable product and devops context
- `specs/<feature-id>/` for active feature intent, plan, and task state

Required GitHub checks:

- `baseline-checks`
- `guard`
- `AI Review`

Agent routing is controlled by repository variables:

- `AI_IMPLEMENTATION_AGENT`
- `AI_REVIEW_AGENT`

## Supported Agents

- `claude`
- `codex`
- `gemini`

Default policy in this repository (canonical):

- implementation: `claude`
- review: `codex`

Claude is the canonical default implementation agent because it owns
architecture, orchestration, CI/CD health, and repository memory for this
repository, and is driven from the user's local Claude Code terminal session.

Codex is the current default review backend. It runs natively on GitHub pull
requests via the ChatGPT Codex connector, triggered by `@codex review` comments
from trusted human actors.

Gemini is available as an alternative review backend via the Gemini Code Assist
GitHub App. Switch with `pnpm run review:switch -- --to gemini`.

Claude review (`claude-review.yml` workflow) is **currently non-operational**:
the workflow file remains in the repository as dead code pending a cleanup PR,
but `ANTHROPIC_API_KEY` is not configured and the local Claude runner was
rolled back. Do not select `AI_REVIEW_AGENT=claude` until this is restored.

## Local macOS Orchestration

Implementation work is prepared locally through repository-owned macOS helpers:

- `scripts/set-implementation-agent.mjs`
- `scripts/new-worktree.mjs`
- `scripts/start-implementation-worker.mjs`
- `scripts/publish-branch.mjs`

One task should map to one worktree, one branch, and one PR. Worktrees are
created inside `<repoRoot>/.claude/worktrees/<slug>/` so they stay inside the
repository and do not pollute the user's `~/projects/` directory.

## Native Execution Surface

- Claude implementation: launched from a local Claude Code terminal session
  against the feature worktree; can dispatch other local agents via CLI when
  needed
- Gemini review: auto-reviews on PR open via Gemini Code Assist GitHub App;
  manual re-review via `/gemini review` posted by a human
- Codex review: `@codex review` on a top-level PR comment (default)
- Claude review: `@claude review once` on a top-level PR comment (third-tier, currently non-operational)

Review normalization behavior:

- `codex` is the current default review backend; `@codex review` from a trusted
  human posts a native PR review
- pull-request `AI Review` runs support `codex` and `gemini`
- this repository currently enables only `codex` and `gemini` as review
  backends in `.unicorn-hub/config.json`; Claude review remains
  non-operational
- trusted human review commands record a current-head review-request marker and
  rerun the PR-linked `AI Review` check
- trusted review evidence from the configured backend reruns `AI Review` again
  so the required check can validate without a long polling window

Only trusted actors may trigger AI workflows:

- `OWNER`
- `MEMBER`
- `COLLABORATOR`
