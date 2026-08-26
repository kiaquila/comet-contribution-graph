# Feature Specification: eslint-plugin-unicorn v73

## Goal

Upgrade `eslint-plugin-unicorn` from v57 to v73 so prototype linting runs on a
plugin release that supports the repository's ESLint v10 configuration.

## Scope

- Apply the Dependabot major update on the current `main` base.
- Verify every unicorn rule referenced by `eslint.config.mjs` still exists and
  that prototype HTML passes `check:js`.
- Record feature memory and durable maintenance evidence.

## Acceptance criteria

- `pnpm run preflight` passes, including `check:js`.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not disable a unicorn rule to silence a genuine new finding; fix the
  prototype source instead, or record an explicit rationale.
