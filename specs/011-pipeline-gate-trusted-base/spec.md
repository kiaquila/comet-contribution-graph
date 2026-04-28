# 011 — pipeline gate runs from trusted base

## Intent

Close a P0-class supply-chain hole in the PR-driven CI pipeline: the
gate-style workflows (`.github/workflows/ai-review.yml`,
`.github/workflows/pr-guard.yml`) currently `actions/checkout` the PR's
own head ref and then execute Node scripts (`scripts/ai-review-gate.mjs`,
`scripts/resolve-pr-context.mjs`, `scripts/check-feature-memory.mjs`) out
of that workspace. A contributor — including a fork — can edit any of
those scripts inside the PR and the gate will dutifully run the patched
version, neutralising every blocking rule (severity gate, feature-memory
requirement, etc.) before the maintainer sees the diff.

The same vulnerability class was found by Codex in the sibling
`tone-of-voice` repo (PR #3) and is being ported across the family.
`comet-contribution-graph` does not currently mark `AI Review` / `guard`
as a required check in branch protection (see the audit table in the
trigger session), but the gate scripts are wired the same way — the
exposure exists the moment we tighten branch protection or someone
reuses the gate output as a signal in another tool.

The fix moves the workflow execution context to the trusted base branch
(`main`) so that the gate code GitHub runs is always the version that
already passed review on `main`, not whatever the PR head proposes.

## Constraints

- One PR; no functional renderer / action / script-policy changes
  outside the gate scripts and the two affected workflow files.
- Guard requires `specs/<id>/{spec,plan,tasks}.md` for any product-path
  change (`.github/workflows/`, `scripts/`). This triad satisfies that.
- The gate run on **this very PR** will fail PR Guard / AI Review,
  because `main` still ships the pre-fix scripts at PR-open time and
  none of those checks are required for merge in this repo today. That
  trade-off is explicitly accepted (analogous to bootstrapping any CI
  hardening change).
- Local pre-push hook
  (`.claude/hooks/check-feature-memory-on-push.sh`) and `pnpm run
check:feature-memory` must keep working — both invoke
  `node scripts/check-feature-memory.mjs origin/main HEAD` in a regular
  working tree where the spec files are present in the committed
  `HEAD` ref.

## Scope

### In scope

- **`.github/workflows/ai-review.yml`** — pin the `actions/checkout`
  step to the repository's default branch via
  `ref: ${{ github.event.repository.default_branch }}`. The downstream
  scripts (`resolve-pr-context.mjs`, `ai-review-gate.mjs`) are pure
  GitHub-API clients keyed by `GITHUB_TOKEN` + `inputs.pr_number`; they
  never read PR files from disk, so running them from `main` is
  semantically a no-op for correctness and a hard win for trust.
- **`.github/workflows/pr-guard.yml`** — same `ref:` switch on the
  checkout step. Add a follow-up `git fetch` for the PR head SHA so
  the existing
  `git diff --name-only "${BASE_REF}...${HEAD_REF}"` invocation can
  still reach both endpoints from the `main` tree.
- **`scripts/check-feature-memory.mjs`** — replace the
  `existsSync(repoRoot/specs/<id>/{spec,plan,tasks}.md)` filesystem
  probe with `git cat-file -e <headRef>:<path>` so the gate (now
  running from `main`) can validate spec files added in the PR's tree
  without ever executing PR-controlled code. Keep the existing
  filesystem probe for the explicit `--worktree` mode (used for
  pre-commit dry runs against uncommitted changes), since there is no
  ref to interrogate in that mode.

### Out of scope (deferred to follow-up PRs)

- **`pnpm install --frozen-lockfile` + `pnpm run check:repo`** at the
  tail of `pr-guard.yml`. After this fix they run against `main`'s
  tree, which means lockfile / baseline regressions introduced by a
  PR are no longer caught here. The post-merge `ci.yml` workflow runs
  the full `pnpm run ci` against `main`, so they will surface within
  one merge cycle, but pre-merge coverage drops. Restoring per-PR
  validation requires either a two-checkout pattern (a separate
  `path: .trusted` checkout alongside a sandboxed PR checkout) or a
  refactor that lifts `check:repo` and the lockfile assertion into
  ref-aware scripts. Tracked separately.
- **`scripts/ai-review-gate.mjs` / `scripts/resolve-pr-context.mjs`
  hardening.** These already only touch the GitHub API; this PR
  delivers the trust boundary at the workflow level and does not
  modify them.
- **Sibling repos.** `pallete-maker`, `dreamboard`, `capsule-zero`,
  `vb-influencer` carry the same vulnerability shape per the audit
  table; the port to each lives in its own PR in its own repository.

## Acceptance

1. `.github/workflows/ai-review.yml` checkout step has
   `ref: ${{ github.event.repository.default_branch }}`.
2. `.github/workflows/pr-guard.yml` checkout step has
   `ref: ${{ github.event.repository.default_branch }}`, the previous
   `inputs.ref || head.sha || github.sha` cascade is gone, and a
   follow-up step fetches the PR head SHA so `git diff` and
   `git cat-file` can reach it.
3. `scripts/check-feature-memory.mjs` no longer calls `existsSync` on
   `specs/<id>/*.md` outside the `--worktree` branch; the ref-based
   path uses `git cat-file -e <headRef>:<path>` instead.
4. `node scripts/check-feature-memory.mjs origin/main HEAD` passes
   locally (this PR's own spec triad must satisfy the gate).
5. `pnpm run ci` is green locally — in particular `format:check`
   covers `.github/workflows/*.yml` and `scripts/**/*.mjs`, so all
   touched files must be prettier-clean.

## Post-merge verification

- After merge, watch the next unrelated PR's `pr-guard` and
  `AI Review` runs land green to confirm the bootstrap is over.
- Spot-check the run logs for `ai-review.yml` to confirm the checkout
  step shows it grabbed `main`, not the PR head.
