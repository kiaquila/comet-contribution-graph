# Feature Specification: html-validate v11

## Goal

Upgrade `html-validate` from v10 to v11 while preserving validation of the
repository prototype.

## Scope

- Apply the Dependabot update on the current `main` base.
- Verify the updated validator under the repository Node runtime.
- Record durable maintenance and feature-memory evidence.

## Acceptance criteria

- `pnpm run preflight` passes with html-validate v11.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- Required checks are green before merge.

## Negative scope

- Do not weaken or disable existing HTML validation rules merely to pass the
  upgrade.
