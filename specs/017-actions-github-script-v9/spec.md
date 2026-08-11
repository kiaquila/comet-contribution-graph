# 017 — actions/github-script v9

## Goal

Upgrade `actions/github-script` from v8 to v9 in the Claude workflow files
without changing workflow behavior.

## Scope

In scope: the two Dependabot-proposed version references and delivery evidence.

Out of scope: workflow triggers, permissions, scripts, review policy, and
unrelated dependencies.

## Acceptance Criteria

1. The workflow diff is limited to `actions/github-script` v8 → v9.
2. Required GitHub checks and Vercel preview pass on the final head.
3. Codex reviews the final head with no unresolved P0–P2 findings.

## Negative Scenarios

- No workflow behavior or action pinning is weakened.
- Prior-head review evidence is not used after publication.

## Verification Evidence

- `pnpm run preflight` passes.
- GitHub reports green `baseline-checks`, `guard`, `AI Review`, and
  `osv-scan` for the final head.
