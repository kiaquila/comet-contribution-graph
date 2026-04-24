# 010 — plan

## Approach

Three isolated edits in three files, no renderer or test-snapshot work.
Guard-compliant via this spec triad. Verification via existing `pnpm
run ci` and `check:feature-memory`.

## Files touched

| file                                | change                                            |
| ----------------------------------- | ------------------------------------------------- |
| `package.json`                      | `"version": "1.2.0"` → `"1.3.1"`                  |
| `README.md`                         | hero image URL swap (`showcase` → `comet-graph`)  |
| `.github/workflows/comet-graph.yml` | add `push: branches: [main]` with `paths:` filter |

## Why bump to `1.3.1` (not `1.3.0` or `1.4.0`)

- Setting it to `1.3.0` right now would immediately drift again the moment
  this PR merges (the merge itself is a chore, not part of the v1.3.0
  release content).
- `1.4.0` implies a new minor feature; the dogfood auto-trigger is a
  workflow-only change with no surface-area impact on renderer or action
  consumers. Patch (`1.3.1`) is the correct SemVer bucket.
- The tag `v1.3.1` created post-merge matches `package.json` exactly,
  restoring the invariant "tag === manifest version."

## Why swap README hero from `showcase` → `comet-graph`

- `showcase` was a static snapshot curated for PR #10 (Staks-sor data,
  pre-v1.3.0 tail). Keeping it in sync with every release requires a
  manual regeneration + force-push, which has already fallen out of sync
  twice (v1.2.0, v1.3.0).
- `comet-graph` is the dogfood output branch, already owned by the
  workflow. Pointing the README there means: the hero shows the author's
  own kiaquila data, rendered by the latest committed renderer, and is
  guaranteed fresh on every `main` merge once the `push` trigger lands.
- One-time bootstrap: after merge, dispatch the workflow once so the
  `comet-graph` branch carries v1.3.0 + kiaquila SVG before the README
  URL starts loading it. Otherwise the hero would briefly regress to the
  2026-04-22 bootstrap snapshot.

## Why add `push` to `comet-graph.yml` (and not just dispatch manually)

- The `schedule: "0 3 * * 1"` cadence means up to 7-day lag between a
  release and the hero/dogfood reflecting it. Visible to anyone reading
  the repo README.
- `workflow_dispatch` requires me to remember. Humans forget.
- `push: branches: [main]` is the standard "CI-style" dogfood trigger
  for published actions (metrics, snk, readme-stats all follow the same
  pattern). `paths:` filter prevents spec/docs PRs from burning a run
  needlessly.

## Tripwires

- **Prettier.** `.github/workflows/*.yml` is under the `format:check`
  glob. Paste yaml must be 2-space indented, no trailing spaces,
  newline-terminated. Run `pnpm run format:check` before pushing.
- **Guard.** `.github/workflows/*.yml` is on the product-path list for
  `check-feature-memory.mjs`. The 010 spec triad satisfies the gate; do
  not commit the yaml change without the spec files in the same commit
  range.
- **Dogfood trigger recursion.** The workflow does not push to `main`
  (it force-pushes to the orphan `comet-graph` branch), so adding a
  `push` trigger on `main` cannot loop.
- **Readme hero cache.** GitHub camo caches SVGs; after the first
  post-merge dogfood run, the hero may display the stale cached image
  for a few minutes. Not a correctness issue.

## Rollback

If the push trigger causes unexpected runs (e.g. if the paths filter is
too loose), revert the workflow yml change in a follow-up commit. The
version bump and README URL swap are independent and safe to keep.
