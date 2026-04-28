# 011 — plan

## Approach

Two workflow yml edits + one targeted script refactor, scoped to the
gate trust boundary. No renderer / action / data-layer changes.

## Files touched

| file                               | change                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ai-review.yml`  | `actions/checkout` gains `ref: ${{ github.event.repository.default_branch }}`                                                                |
| `.github/workflows/pr-guard.yml`   | `actions/checkout` switches to `ref: default_branch`; new `git fetch` step pulls the PR head SHA so `git diff` / `git cat-file` keep working |
| `scripts/check-feature-memory.mjs` | `existsSync(specs/<id>/*.md)` replaced by `git cat-file -e <headRef>:<path>` for the ref-based mode; `--worktree` mode keeps the FS probe    |

## Why pin checkout to `default_branch` and not e.g. a static `main`

- `default_branch` is the runtime-provided property of the repository
  itself (`github.event.repository.default_branch`), so a one-time
  rename of the default branch (`main` → `trunk`, etc.) does not
  silently turn the gate back into "checkout from PR head" via
  fall-through. Hard-coding `main` would do exactly that.
- The `inputs.ref ||` cascade in the previous yml was the actual
  vulnerability root: it allowed a `workflow_dispatch` caller to
  override the ref to anything, including a PR head, while still
  presenting itself as the trusted gate. Removing the cascade
  altogether is part of the fix; `default_branch` is the only
  value the gate ever needs.

## Why `git cat-file -e` over `existsSync`

- The original filesystem probe was correct only because the workflow
  used to checkout the PR head, so `repoRoot/specs/<id>/spec.md` was
  the PR's own copy. After this PR, `repoRoot` points at `main`'s
  tree, so a freshly-introduced `specs/<id>/` exists only inside the
  PR's tree under the PR head SHA — it has no presence on disk.
- `git cat-file -e <ref>:<path>` is a non-executing existence probe
  against an arbitrary git ref. It is the canonical way to ask "does
  this path exist in this commit?" without touching the working tree
  or shelling out to anything that interprets file contents. It does
  not run hooks, scripts, or `.gitattributes` filters that could be
  weaponised by a malicious PR.
- The probe has a small enough surface that we can keep both modes in
  one script: ref-aware in CI / pre-push, FS-aware in `--worktree`
  for pre-commit dry-runs against uncommitted local changes.

## Why fetch the PR head SHA explicitly in `pr-guard.yml`

- `actions/checkout` with `ref: default_branch` and `fetch-depth: 0`
  fetches `main`'s history, but the PR head SHA is not yet on any
  branch we track from `main`'s perspective.
- Without an explicit `git fetch origin <head-sha>` step, the existing
  `git diff --name-only "${BASE_REF}...${HEAD_REF}"` would die with
  "fatal: bad revision" because `HEAD_REF` is unreachable.
- Fetching by SHA (rather than by `refs/pull/N/head`) is the simplest
  shape: GitHub Actions resolves `github.event.pull_request.head.sha`
  for us and the SHA is verifiable.
- **No `--depth` cap on the fetch** (Codex P2 on PR #14). The
  trusted-base checkout already pulled `main`'s full history with
  `fetch-depth: 0`, so an unbounded `git fetch origin <sha>` only
  adds the PR-side commits down to the existing merge-base and
  stops; bandwidth is bounded by the actual divergence. A fixed cap
  like `--depth=200` would silently drop the merge-base for
  long-lived PR branches (or branches with >cap commits since fork)
  and break the diff with `fatal: bad revision` even on otherwise
  valid PRs.

## Bootstrap caveat (deliberately accepted)

- For _this_ PR's own CI runs, `pr-guard` will check out `main`'s
  pre-fix `scripts/check-feature-memory.mjs`, which still uses
  `existsSync` and therefore cannot see `specs/011/*.md` (which are
  only present in the PR head's tree, not in `main`). The gate will
  fail loudly. Same for `AI Review` if Codex objects to the
  trust-boundary diff.
- Neither check is required for merge in this repo's branch
  protection today, so the maintainer can land the PR despite the red
  marks. After merge, every subsequent PR runs the new ref-aware
  script from `main` and the gate behaves normally.
- This is the standard "you have to bootstrap a tightening change
  through one PR that fails its own gate" pattern; mitigations
  (cherry-picked dispatch on `main` ahead of time, or splitting into
  two PRs) cost more than the single-PR red-light merge.

## Tripwires

- **Prettier.** Both yml files and the mjs script live under
  `format:check` globs. Tabs / trailing whitespace / non-ASCII
  surprises will fail `pnpm run ci`.
- **Guard self-test.** Run `node scripts/check-feature-memory.mjs
origin/main HEAD` after every edit pass to make sure the rewritten
  script still passes the gate against this PR's own commits.
- **Local pre-push hook.** It calls the same script in non-`--worktree`
  mode. Verify it still exits 0 once the spec triad is committed.
- **`workflow_dispatch` callers.** `pr-guard.yml` previously honored
  `inputs.ref` so an operator could re-run the gate against an
  arbitrary commit. Removing the cascade narrows that surface; if
  anyone relied on it, they'll need to re-trigger via the standard
  pull-request event instead.

## Rollback

- The yml ref-pin is idempotent and trivially revertible — drop the
  `ref:` line from each workflow.
- The script refactor is a self-contained block; reverting just that
  function restores the old `existsSync` shape and the gate continues
  to work _as long as_ the workflows still checkout from PR head. Do
  not partial-revert (yml without script, or vice versa) — the
  combinations leave the gate broken in opposite directions.
