# 019 — actions/setup-node v7

## Goal

Upgrade `actions/setup-node` from v4 to v7 in CI and PR Guard without
changing workflow behavior.

## Scope

In scope: Dependabot's version-only workflow update and its delivery evidence.

Out of scope: Node versions, cache settings, workflow triggers, permissions,
and unrelated dependencies.

## Acceptance Criteria

1. Changed workflows differ only by `actions/setup-node` v4 → v7.
2. Required checks and Vercel preview are green for the final head.
3. Final-head Codex review has no unresolved P0–P2 findings.

## Negative Scenarios

- Setup inputs and action version pinning remain intact.
- Review evidence from an earlier head cannot be reused.

## Verification Evidence

- `pnpm run preflight` passes locally.
- GitHub reports green `baseline-checks`, `guard`, `AI Review`, and
  `osv-scan` on the final head.
