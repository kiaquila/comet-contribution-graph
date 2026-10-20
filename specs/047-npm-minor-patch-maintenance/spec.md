# Spec: npm minor and patch maintenance

## Goal

Adopt the grouped Dependabot updates for `@types/node`, ESLint, `globals`,
html-validate, and Prettier while preserving the repository's build and
validation behavior.

## Scope

In scope:

- Update `@types/node` from 26.6.2 to 26.6.5.
- Update ESLint from 10.11.0 to 10.12.0.
- Update `globals` from 17.12.0 to 17.13.0.
- Update html-validate from 11.16.1 to 11.16.2.
- Update Prettier from 3.9.9 to 3.9.10.
- Accept the corresponding transitive lockfile updates.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Relaxing TypeScript, ESLint, html-validate, or formatting configuration.
- Changing application behavior or generated Action output.
- Updating unrelated direct dependencies.

## Acceptance Criteria

1. The manifest and lockfile resolve the five requested direct dependency
   versions and retain `eslint-plugin-html` 8.2.1.
2. A frozen lockfile install succeeds without further lockfile changes.
3. Type checking, prototype linting, HTML validation, Action build,
   distribution verification, formatting, and tests pass through
   `pnpm run preflight`.
4. The final diff contains no validation-policy or product-code changes.
5. All required GitHub checks pass on the final head.
6. A current-head Codex review has no unresolved blocking findings or threads.

## Negative Scenarios

- Validation configuration is weakened to accommodate a dependency regression.
- The frozen install rewrites the lockfile or resolves unexpected direct
  versions.
- The regenerated Action distribution differs from the checked-in artifact.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm run preflight` succeeds on the final head.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
