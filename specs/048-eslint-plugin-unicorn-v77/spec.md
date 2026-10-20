# Spec: eslint-plugin-unicorn v77 maintenance

## Goal

Adopt `eslint-plugin-unicorn` v77 while preserving the repository's existing
lint rules and validation behavior on ESLint 10.12.0.

## Scope

In scope:

- Update `eslint-plugin-unicorn` from v76 to v77.
- Resolve the plugin peer snapshot against ESLint 10.12.0 after merging the
  current `main` base.
- Accept the corresponding transitive lockfile updates.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Enabling new v77 rules or changing existing lint configuration.
- Changing application behavior or generated Action output.
- Updating unrelated direct dependencies.

## Acceptance Criteria

1. The manifest and lockfile resolve `eslint-plugin-unicorn` 77.0.0 with
   ESLint 10.12.0.
2. A frozen lockfile install succeeds without further lockfile changes.
3. Prototype linting and the complete `pnpm run preflight` chain pass.
4. The final diff contains no validation-policy or product-code changes.
5. `baseline-checks`, `guard`, `AI Review`, and `osv-scan` pass on the final
   head.
6. A current-head Codex review has no unresolved blocking findings or threads.

## Negative Scenarios

- Lint configuration is weakened to accommodate a dependency regression.
- The lockfile retains a stale ESLint 10.11.0 peer snapshot.
- The frozen install rewrites the lockfile or resolves unexpected direct
  versions.
- The regenerated Action distribution differs from the checked-in artifact.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm run preflight` succeeds on the final head.
- All four required GitHub checks are green.
- GitHub reports no unresolved review threads before merge.
