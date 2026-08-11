# 016 — actions/checkout v7

## Goal

Upgrade `actions/checkout` from v6 to v7 across repository workflows while
preserving the existing CI and review contracts.

## Scope

In scope:

- Replace only `actions/checkout@v6` references with `actions/checkout@v7`.
- Record maintenance intent and verification evidence.

Out of scope:

- Changing workflow jobs, permissions, triggers, or checkout inputs.
- Updating any other action or package.

## Acceptance Criteria

1. Every changed workflow differs only by its `actions/checkout` version.
2. Required checks and the Vercel preview are green on the final head.
3. Codex reviews the final head and leaves no unresolved P0–P2 findings.

## Negative Scenarios

- No workflow gains an unpinned checkout action or changes checkout behavior.
- Review evidence from an older head SHA is not used for merge.

## Verification Evidence

- `pnpm run preflight` succeeds before publishing.
- GitHub reports green `baseline-checks`, `guard`, `AI Review`, and
  `osv-scan` for the final head.
