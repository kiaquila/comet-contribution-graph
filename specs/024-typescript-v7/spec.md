# Feature Specification: TypeScript v7

## Goal

Upgrade TypeScript from v5 to v7 while preserving renderer and GitHub Action
type safety.

## Scope

- Apply the Dependabot TypeScript major update on the current `main` base.
- Verify compiler checks, builds, and tests under TypeScript v7.
- Record feature-memory and durable maintenance evidence.

## Acceptance criteria

- `pnpm run preflight` passes under TypeScript v7.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not reduce compiler strictness or suppress diagnostics merely to pass the
  upgrade.
