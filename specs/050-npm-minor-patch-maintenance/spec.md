# Spec: npm minor and patch maintenance

## Goal

Adopt the grouped Dependabot updates for ESLint 10.13.0 and html-validate
11.17.0 while preserving the repository's build, validation, and supply-chain
behavior.

## Scope

In scope:

- Update ESLint from 10.12.0 to 10.13.0.
- Update html-validate from 11.16.2 to 11.17.0.
- Accept the corresponding peer snapshot and lockfile updates.
- Merge the current base so the existing `fast-uri` and `undici` security fixes
  remain present.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Relaxing ESLint, html-validate, formatting, permissions, security policy, or
  workflow configuration.
- Changing product behavior or generated Action output.
- Updating unrelated direct dependencies.

## Acceptance Criteria

1. The manifest and lockfile resolve ESLint 10.13.0 and html-validate 11.17.0.
2. The lockfile retains `fast-uri` 3.1.9 and `undici` 6.29.1 from current
   `main`.
3. A frozen lockfile install succeeds without further lockfile changes.
4. Prototype linting, HTML validation, type checking, Action build,
   distribution verification, formatting, and tests pass through
   `pnpm run preflight`.
5. The final diff contains no validation-policy or product-code changes.
6. All required GitHub checks pass on the final head.
7. A current-head Codex review has no unresolved blocking findings or threads.

## Negative Scenarios

- Validation configuration is weakened to accommodate a dependency regression.
- The current base's security fixes are lost while resolving the branch update.
- The frozen install rewrites the lockfile or resolves unexpected direct
  versions.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm run preflight` succeeds on the final local implementation.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
