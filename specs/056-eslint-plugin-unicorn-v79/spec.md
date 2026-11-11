# Spec: eslint-plugin-unicorn v79 maintenance

## Goal

Adopt `eslint-plugin-unicorn` v79 while preserving the repository's existing
lint rules and validation behavior on ESLint 10.14.0.

## Scope

In scope:

- Update `eslint-plugin-unicorn` from v78 to v79.
- Resolve the plugin peer snapshot against ESLint 10.14.0 and the repository's
  existing optional TypeScript 7 dependency.
- Accept the corresponding transitive lockfile updates.
- Merge the current base so the preceding dependency and workflow maintenance
  remains present.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Enabling new v79 rules, enabling `unicorn/no-top-level-side-effects`, or
  changing existing lint configuration.
- Changing application behavior or generated Action output.
- Updating unrelated direct dependencies.

## Acceptance Criteria

1. The manifest and lockfile resolve `eslint-plugin-unicorn` 79.0.0 with ESLint
   10.14.0 and TypeScript 7.0.2.
2. The existing `unicorn/no-array-callback-reference` rule remains available
   and passes against the current prototype sources.
3. The project continues to satisfy v79's ESLint 10.4+, flat-config, ESM, and
   Node 22+ requirements.
4. A frozen lockfile install succeeds without further lockfile changes.
5. Prototype linting and the complete `pnpm run preflight` chain pass.
6. The final diff contains no lint-policy or product-code changes.
7. `baseline-checks`, `guard`, `AI Review`, and `osv-scan` pass on the final
   head, with no unresolved blocking review findings or threads.

## Negative Scenarios

- Lint configuration is weakened to accommodate a dependency regression.
- The v79 `no-top-level-side-effects` behavior change is enabled implicitly.
- The current base's dependency or security maintenance is lost while
  resolving the branch update.
- A frozen install rewrites the lockfile or resolves unexpected direct versions.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm run preflight` succeeds on the final head.
- All four required GitHub checks are green.
- GitHub reports no unresolved review threads before merge.
