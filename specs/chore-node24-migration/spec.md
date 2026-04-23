# Feature chore-node24-migration — Migrate Action runtime to Node 24

## Goal

Update the GitHub Action runtime declaration from Node 20 to Node 24 and align
all related tooling (checkout action, type definitions, engine field) to match.

## Why

GitHub is deprecating Node 20 Actions. Starting 2026-06-02, Node 24 will be
the forced default. The deprecation warning appeared during the PR 006
bootstrap run on `kiaquila/kiaquila`. CI already runs on Node 24 via
`actions/setup-node`; this PR makes the Action runtime declaration match reality.

## Scope

**In scope**

- `action.yml` — `using: "node20"` → `"node24"`
- `.github/workflows/comet-graph.yml` — `actions/checkout@v4` → `@v6`
- `.github/workflows/ai-review.yml` — `actions/checkout@v4` → `@v6`
- `package.json` — `engines.node` `>=20` → `>=24`; `@types/node` `^20` → `^24`
- `pnpm-lock.yaml` — regenerated after dep bump
- `README.md` — Usage snippet `checkout@v4` → `@v6`
- `docs_comet/project/devops/github-action-target.md` — update Node version reference
- `dist-action/index.js` — rebuilt via `ncc build`; `check:dist` verifies byte-identity

**Out of scope**

- Any runtime behavior changes (pure version declaration update)
- `v1` tag (follow-up after merge)

## Acceptance criteria

- `pnpm run ci` fully green (all 78 tests pass, `check:dist` byte-identical)
- No Node 20 references remain in `action.yml` or workflow files
- `check:feature-memory` passes
