# 021 — ESLint v10

## Goal

Upgrade ESLint from v9 to v10 while preserving lint behavior and repository
validation.

## Scope

In scope: the Dependabot ESLint package and lockfile update, compatibility
validation, and delivery evidence.

Out of scope: lint-rule policy, unrelated packages, and product behavior.

## Acceptance Criteria

1. The final dependency diff is limited to ESLint and its resolved graph.
2. Lint and the complete preflight chain pass with ESLint v10.
3. Final-head Codex review has no unresolved P0–P2 findings.

## Negative Scenarios

- Existing lint configuration does not silently degrade or become ignored.
- A prior-head review cannot satisfy the final gate.

## Verification Evidence

- `pnpm run preflight` passes with ESLint v10 installed.
- All required GitHub checks and preview are green on the final head.
