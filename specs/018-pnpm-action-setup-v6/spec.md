# 018 — pnpm/action-setup v6

## Goal

Upgrade `pnpm/action-setup` from v4.3.0 to v6.0.10 in CI and PR Guard
workflows without changing their behavior.

## Scope

In scope: the Dependabot-proposed action references and this delivery evidence.

Out of scope: workflow logic, permissions, trigger changes, and unrelated
dependency updates.

## Acceptance Criteria

1. The workflow diff is limited to `pnpm/action-setup` version references.
2. The final head has green required checks and a healthy Vercel preview.
3. A final-head Codex review has no unresolved P0–P2 findings.

## Negative Scenarios

- The setup action remains explicitly versioned and workflow inputs are
  unchanged.
- Older review evidence cannot satisfy the final-head gate.

## Verification Evidence

- `pnpm run preflight` passes locally.
- GitHub reports green `baseline-checks`, `guard`, `AI Review`, and
  `osv-scan` for the final head.
