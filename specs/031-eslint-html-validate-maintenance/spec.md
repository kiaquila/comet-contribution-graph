# Feature Specification: ESLint and html-validate maintenance

## Goal

Apply the grouped Dependabot development-dependency update for ESLint 10.9.0
and html-validate 11.10.0, keeping repository validation current.

## Scope

- Update only the two grouped development dependencies and their lockfile
  entries from the current `main` base.
- Verify the repository's JavaScript linting and HTML validation continue to
  pass without configuration or product-source changes.
- Record feature memory and durable dependency-maintenance evidence.

## Acceptance criteria

- `pnpm run preflight` passes, including `check:js`, `check:html`, type
  checking, Action bundling, distribution validation, formatting, and tests.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not alter lint rules, HTML validation configuration, renderer behavior,
  Action output, or production dependencies to accommodate this update.
