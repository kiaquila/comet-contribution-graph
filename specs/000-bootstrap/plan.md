# Plan — Bootstrap working environment

## Approach

Single PR, executed via `/ultrawork` with 4 parallel executor streams, each owning a disjoint file set. All streams read the pallete-maker template from `origin/main` only (local checkout was on stale WIP branch and could not be trusted).

## Streams

### Stream A — Workflows + security configs

- `.github/workflows/ci.yml`, `pr-guard.yml`, `ai-review.yml`, `ai-command-policy.yml`, `claude-agent.yml`, `claude-review.yml`, `osv-scan.yml`
- `.github/dependabot.yml`
- `.gemini/config.yaml`, `.gemini/styleguide.md` (rewritten for comet)
- `.htmlvalidate.json`

### Stream B — Scripts

- Ported as-is: `resolve-pr-context`, `ai-review-helpers`, `set-implementation-agent`, `new-worktree`, `publish-branch`, `switch-review-agent`, `ai-review-gate` (default `codex` preserved)
- Text-adapted: `start-implementation-worker`
- Rewritten: `build-static` (copy prototype to dist), `check-static-baseline` (comet requiredFiles + prototype HTML assertions), `check-feature-memory` (comet product paths incl. `prototypes/`, `action.yml`)

### Stream C — Docs + memory layers

- `.specify/memory/constitution.md` (comet-adapted 8 rules)
- `docs_comet/` tree: README, project-idea, adr/, frontend/, devops/ (7 files: orchestration-protocol, pr-workflow, review-contract, review-trigger-automation, vercel-cd, delivery-playbook, github-action-target)
- `AGENTS.md`, `CLAUDE.md`, revised `README.md`
- `specs/000-bootstrap/{spec,plan,tasks}.md`

### Stream D — Package, Vercel, root config

- `package.json` (tailwindcss dropped, comet scripts)
- `pnpm-workspace.yaml` (`minimumReleaseAge: 10080`)
- `vercel.json` (CSP allowlist rewritten for Google Fonts only)
- `LICENSE` (MIT, same owner)
- `.gitignore` (expanded)
- `tests/bootstrap.test.mjs` (smoke tests)

## Key adaptations vs pallete-maker origin/main

- Default review agent: `codex` (matches pallete-maker `origin/main`; user reminder `feat/005-local-claude-runner` was a stale WIP branch we must not copy from)
- Self-hosted macOS runner: NOT ported (rolled back in pallete-maker PR #9)
- `.github/claude/prompts/`: NOT ported (does not exist on pallete-maker `origin/main`)
- `docs_pallete_maker/ai-runner.md` and `macos-local-runners.md`: NOT ported (removed with runner rollback)
- Tailwindcss: dropped (prototype is plain CSS)
- `index.html`, `src/`, harmony module, PNG export: not applicable
- CSP allowlist: Google Fonts only (prototype's only external resource)

## Validation order

1. All 4 streams complete file writes
2. `pnpm install --frozen-lockfile`
3. `pnpm run ci` green
4. Manual `git diff` review for accidental `pallete-maker` leakage
5. Commit on branch `claude/goofy-elion-be6a79`
6. Push + open PR
7. Await `baseline-checks`, `guard`, `AI Review`, Vercel preview

## Risks

- `pnpm install` without a lockfile may fail the `--frozen-lockfile` contract — initial install generates the lockfile; committed in this PR
- Vercel project must be connected manually by repo owner (out of PR scope); preview will no-op until connected
- `codex` review backend needs Codex GitHub connector installed on the repo (out of PR scope)
