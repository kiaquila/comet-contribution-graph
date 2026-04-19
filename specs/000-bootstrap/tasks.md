# Tasks — Bootstrap working environment

## Stream A — Workflows + security configs

- [x] `.github/workflows/ci.yml`
- [x] `.github/workflows/pr-guard.yml` (product paths include `prototypes/`, `action.yml`)
- [x] `.github/workflows/ai-review.yml`
- [x] `.github/workflows/ai-command-policy.yml` (default review → `codex`)
- [x] `.github/workflows/claude-agent.yml` (system-prompt for comet)
- [x] `.github/workflows/claude-review.yml` (review focus for comet)
- [x] `.github/workflows/osv-scan.yml`
- [x] `.github/dependabot.yml` (weekly, Europe/Moscow)
- [x] `.gemini/config.yaml`
- [x] `.gemini/styleguide.md` (rewritten)
- [x] `.htmlvalidate.json`

## Stream B — Scripts

- [x] `scripts/resolve-pr-context.mjs`
- [x] `scripts/ai-review-helpers.mjs`
- [x] `scripts/set-implementation-agent.mjs`
- [x] `scripts/new-worktree.mjs`
- [x] `scripts/start-implementation-worker.mjs`
- [x] `scripts/publish-branch.mjs`
- [x] `scripts/switch-review-agent.mjs`
- [x] `scripts/ai-review-gate.mjs` (default `codex` preserved)
- [x] `scripts/build-static.mjs` (rewritten for prototype)
- [x] `scripts/check-static-baseline.mjs` (rewritten)
- [x] `scripts/check-feature-memory.mjs` (comet product paths)

## Stream C — Docs + memory

- [x] `.specify/memory/constitution.md`
- [x] `docs_comet/README.md`
- [x] `docs_comet/project-idea.md`
- [x] `docs_comet/adr/README.md`
- [x] `docs_comet/project/frontend/frontend-docs.md`
- [x] `docs_comet/project/devops/ai-orchestration-protocol.md`
- [x] `docs_comet/project/devops/ai-pr-workflow.md`
- [x] `docs_comet/project/devops/review-contract.md`
- [x] `docs_comet/project/devops/review-trigger-automation.md`
- [x] `docs_comet/project/devops/vercel-cd.md`
- [x] `docs_comet/project/devops/delivery-playbook.md`
- [x] `docs_comet/project/devops/github-action-target.md`
- [x] `AGENTS.md`
- [x] `CLAUDE.md`
- [x] `README.md` (replaced)
- [x] `specs/000-bootstrap/spec.md`
- [x] `specs/000-bootstrap/plan.md`
- [x] `specs/000-bootstrap/tasks.md`

## Stream D — Package + Vercel + root

- [x] `package.json` (tailwindcss dropped)
- [x] `pnpm-workspace.yaml` (`minimumReleaseAge: 10080`)
- [x] `vercel.json` (CSP: Google Fonts only)
- [x] `LICENSE`
- [x] `.gitignore` (expanded)
- [x] `tests/bootstrap.test.mjs`

## Verification

- [ ] `pnpm install --frozen-lockfile` succeeds (generates lockfile on first run)
- [ ] `pnpm run ci` green
- [ ] `git grep -n "docs_pallete_maker"` returns no hits
- [ ] `git grep -n "self-hosted"` returns no hits outside citations
- [ ] Commit on branch `claude/goofy-elion-be6a79`
- [ ] PR opened against `main`
- [ ] Required checks green

## Post-merge manual steps (out of PR scope)

- [ ] `gh variable set AI_IMPLEMENTATION_AGENT --body claude`
- [ ] `gh variable set AI_REVIEW_AGENT --body codex`
- [ ] Connect repo to Vercel (kiaquila team)
- [ ] Install Codex GitHub connector on repo
- [ ] Optionally install Gemini Code Assist App (fallback review)
- [ ] Optionally configure `ANTHROPIC_API_KEY` if Claude GH-path review ever needed
