# 010 — version sync + dogfood auto-trigger

## Intent

Two small chores bundled into a single PR to keep the release story clean
after v1.3.0 (`90710ec`, PR #12 — gradient-ellipse comet tail):

1. **Version metadata drift.** `package.json` is still pinned at `1.2.0`
   while the latest published tag / release is `v1.3.0`. The repo is
   `"private": true` (never npm-published), so the drift has no external
   consumer impact, but it misleads anyone reading the repo at HEAD
   (`git blame`, `grep`, Renovate, Dependabot, etc.).

2. **Dogfood pipeline does not auto-refresh.** The source repo's
   [.github/workflows/comet-graph.yml](../../.github/workflows/comet-graph.yml)
   only has `schedule` (Mon 03:00 UTC) + `workflow_dispatch` triggers.
   After PRs #11 (v1.2.0) and #12 (v1.3.0) landed on `main`, the dogfood
   never ran, and the README hero image on the `showcase` branch (stale
   `Staks-sor` snapshot from PR #10) still represents the previous visual
   era. The user-visible symptom: profile at `github.com/kiaquila` shows
   a two-day-old comet geometry.

## Constraints

- Single PR; no functional renderer / action changes.
- Guard requires `specs/<id>/{spec,plan,tasks}.md` for any product-path
  change (package.json, workflow yml, README). This triad satisfies it.
- No breaking changes to `action.yml` inputs — downstream profile
  workflow (`kiaquila/kiaquila/.github/workflows/comet-graph.yml`)
  continues to work as-is.

## Scope

### In scope

- Bump `package.json` version `1.2.0` → `1.3.1`. The bump captures the
  already-shipped v1.3.0 plus this chore PR's changes, so the next
  release tag (v1.3.1) matches the `package.json` field exactly.
- Swap README hero image URL from
  `https://raw.githubusercontent.com/kiaquila/comet-contribution-graph/showcase/comet.svg`
  → `https://raw.githubusercontent.com/kiaquila/comet-contribution-graph/comet-graph/comet.svg`.
  The `comet-graph` branch is the source-repo's own dogfood output,
  regenerated from `kiaquila` data on every run of
  `.github/workflows/comet-graph.yml`. After this PR lands, that branch
  starts auto-refreshing on every push to `main`, so the hero stays
  current by construction.
- Add `push: branches: [main]` trigger with a `paths:` filter to
  `.github/workflows/comet-graph.yml` so the source-repo dogfood runs on
  every merge that touches actual action code. Filter: `src/**`,
  `dist-action/**`, `action.yml`, `scripts/fetch-contributions.mjs`.
  Spec/docs-only PRs do not trigger the run.

### Out of scope (deferred)

- Cross-repo auto-update of the user's own profile repo
  (`kiaquila/kiaquila`). That workflow lives in a different repository
  and cannot be triggered by `GITHUB_TOKEN` from this repo. A future
  `repository_dispatch` wiring (requires a PAT) can be added as a
  separate spec if weekly cadence proves insufficient. For now, profile
  refresh after each release is done via a one-shot
  `gh workflow run comet-graph.yml -R kiaquila/kiaquila` dispatch,
  documented in [tasks.md](./tasks.md).
- Retirement of the `showcase` branch. Once the README hero no longer
  references it, the branch is inert but harmless. Deletion is a
  separate chore if desired.

## Acceptance

1. `package.json` version field reads `1.3.1` at HEAD.
2. `README.md` hero image URL points to `.../comet-graph/comet.svg`, not
   `.../showcase/comet.svg`.
3. `.github/workflows/comet-graph.yml` `on:` block includes `push` with
   `branches: [main]` and the paths filter listed above, in addition to
   the existing `schedule` and `workflow_dispatch`.
4. `pnpm run ci` passes locally (includes `format:check`, so the new
   yaml must be prettier-clean).
5. `node scripts/check-feature-memory.mjs origin/main HEAD` passes
   (guard gate).

## Post-merge verification

- Trigger
  `gh workflow run comet-graph.yml -R kiaquila/comet-contribution-graph`
  once to backfill the `comet-graph` branch with a fresh v1.3.0 + kiaquila
  SVG before the README hero starts loading it.
- Trigger `gh workflow run comet-graph.yml -R kiaquila/kiaquila` to
  refresh the user's profile with the v1.3.0 renderer.
- Tag `v1.3.1` and move `v1`; create GitHub Release; tick the
  Marketplace "Publish this release to Marketplace" checkbox in the
  web UI (per project memory, `gh release create` does not flip it).
- Delete the `experiment/009-comet-tail` remote branch.
