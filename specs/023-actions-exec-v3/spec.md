# Feature Specification: @actions/exec v3

## Goal

Upgrade the GitHub Action runtime dependency `@actions/exec` from v1 to v3.

## Scope

- Apply the Dependabot update on the current `main` base.
- Verify Action entrypoint behavior and its checked-in distribution artifact.
- Record durable dependency-maintenance and feature-memory evidence.

## Acceptance criteria

- `pnpm run preflight` passes, including Action tests and the distribution
  check.
- The final PR head has current-head Codex review evidence with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not change Action behavior except where required for compatibility with
  the dependency major.
