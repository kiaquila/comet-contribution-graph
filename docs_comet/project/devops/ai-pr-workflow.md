# AI Pull Request Workflow

> Audience: all agents. **Canonical source** for: PR-specific gates and merge rules. Prereq: `.specify/memory/constitution.md` (Standard Feature Loop), `ai-orchestration-protocol.md` (agent routing). Next: `review-contract.md`.

This doc covers PR-specific gates. The 10-step Standard Feature Loop lives in `.specify/memory/constitution.md § Standard Feature Loop` — do not duplicate here.

## Roles

- Claude owns architecture, repository memory, CI/CD health, and local
  orchestration, and is the default implementation agent.
- The selected implementation agent writes scoped code on a feature branch.
- GitHub Actions runs `baseline-checks`, `guard`, and `AI Review`.
- Vercel provides preview deployments for PRs and production deploy on merge to
  `main` (temporary prototype preview infra; see `vercel-cd.md`).
- A human remains the final merge authority.

## Hard Gates

- Product changes in `prototypes/`, `src/`, future app code, or runtime config do
  not start without an active `specs/<feature-id>/` folder.
- Local product edits in the main checkout do not count as completed work.
- If the selected implementation agent path is unavailable, stop and report the
  blocker instead of bypassing the loop.
- Before pushing, run `pnpm run preflight`; it checks working-tree feature
  memory before replaying the repository CI chain locally.
- A PR is not done while required checks are queued, running, or red.

## Review Contract

Summary (details in `review-contract.md` and `ai-orchestration-protocol.md`):

- `AI Review` is the normalized required check regardless of the backend.
- Reviewer selection comes only from `AI_REVIEW_AGENT` (current default: `codex`).
- Low-severity-only findings are advisory and non-blocking.
- **Human trigger required for Codex on EVERY review**, including the first
  review on PR open — Codex does not auto-review. (Only Gemini Code Assist
  auto-reviews on `opened` / `ready_for_review`.) The gate runs with
  `trigger_mode=skip` on `pull_request` events and polls for an existing
  same-head review, so without a human trigger it waits until timeout.
- After a new push on an already-open PR, a human must post the native
  trigger comment again (`@codex review`, `/gemini review`, or
  `@claude review once`), or run `pnpm run review:switch -- --to <agent>`.
  Bot-posted triggers are rejected by all three backends — see
  `review-trigger-automation.md`.

## Merge-Ready Definition

The current PR head SHA is merge-ready only when:

- `baseline-checks` is green
- `guard` is green
- `AI Review` is green
- Vercel preview is healthy for the changed flow
- no blocking review findings remain unresolved
- no merge conflicts remain

## Related Docs

- `docs_comet/project/devops/ai-orchestration-protocol.md`
- `docs_comet/project/devops/local-preflight.md`
- `docs_comet/project/devops/review-trigger-automation.md`
- `docs_comet/project/devops/vercel-cd.md`
- `docs_comet/project/devops/delivery-playbook.md`
