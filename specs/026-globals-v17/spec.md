# Feature Specification: globals v17

## Goal

Upgrade the `globals` development dependency from v16 to v17 while keeping the
ESLint flat configuration for prototype HTML valid.

## Scope

- Apply the Dependabot `globals` major update on the current `main` base.
- Verify the ESLint global environment sets referenced by `eslint.config.mjs`
  still resolve under v17.
- Record feature memory and durable maintenance evidence.

## Acceptance criteria

- `pnpm run preflight` passes, including `check:js`.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not relax or delete lint rules to absorb changed global sets.
