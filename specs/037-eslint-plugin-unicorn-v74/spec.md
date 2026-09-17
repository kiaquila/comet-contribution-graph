# Spec: eslint-plugin-unicorn v74

## Goal

Upgrade `eslint-plugin-unicorn` from v73 to v74 while preserving the
repository's prototype lint policy and the already adopted ESLint 10.10.0
toolchain.

## Scope

In scope:

- Update the direct development dependency to `eslint-plugin-unicorn` v74.
- Regenerate its lockfile resolution on top of the current `main` dependency
  set.
- Verify that all configured Unicorn rules still load and pass.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Adding, removing, or relaxing lint rules.
- Reformatting or refactoring prototype code to create an artificial pass.
- Updating unrelated dependencies or product behavior.

## Acceptance Criteria

1. `package.json` requests `eslint-plugin-unicorn` v74 and the lockfile resolves
   v74 against ESLint 10.10.0.
2. A frozen lockfile install succeeds without further lockfile changes.
3. Prototype linting and the complete `pnpm run preflight` chain pass unchanged.
4. All required GitHub checks pass on the final head.
5. A current-head Codex review has no unresolved blocking findings or review
   threads.

## Negative Scenarios

- Lint configuration or prototype source is weakened merely to accommodate the
  major-version update.
- Resolving the lockfile silently reverts dependencies merged through PR #44.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are green.
- GitHub reports no unresolved review threads before merge.
