# Spec: eslint-plugin-unicorn v78 maintenance

## Goal

Adopt `eslint-plugin-unicorn` v78 while preserving the repository's existing
lint rules and validation behavior on ESLint 10.13.0.

## Scope

In scope:

- Update `eslint-plugin-unicorn` from v77 to v78.
- Resolve the plugin peer snapshot against ESLint 10.13.0 and the repository's
  existing optional TypeScript 7 dependency.
- Accept the corresponding transitive lockfile updates.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Enabling new v78 rules or changing existing lint configuration.
- Changing application behavior or generated Action output.
- Updating unrelated direct dependencies.

## Acceptance Criteria

1. The manifest and lockfile resolve `eslint-plugin-unicorn` 78.0.0 with ESLint
   10.13.0 and TypeScript 7.0.2.
2. The existing `unicorn/no-array-callback-reference` rule remains available
   and passes against the current prototype sources.
3. A frozen lockfile install succeeds without further lockfile changes.
4. Prototype linting and the complete `pnpm run preflight` chain pass.
5. The final diff contains no lint-policy or product-code changes.
6. `baseline-checks`, `guard`, `AI Review`, and `osv-scan` pass on the final
   head, with no unresolved blocking review findings or threads.

## Negative Scenarios

- Lint configuration is weakened to accommodate a dependency regression.
- The lockfile drops the `minimatch` 11.0.1 security override merged from main.
- New v78 rules are enabled implicitly as part of the maintenance update.
- A frozen install rewrites the lockfile or resolves unexpected direct versions.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm run preflight` succeeds on the final head.
- All four required GitHub checks are green.
- GitHub reports no unresolved review threads before merge.
