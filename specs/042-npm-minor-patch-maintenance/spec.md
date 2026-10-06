# Spec: npm minor and patch maintenance

## Goal

Adopt the compatible grouped development-tooling updates proposed by
Dependabot while preserving the repository's validation, build, and Action
distribution contracts.

## Scope

In scope:

- Update ESLint from 10.10.0 to 10.11.0 together with the compatible
  `eslint-plugin-html` 8.2.1 processor fix.
- Update html-validate from 11.16.0 to 11.16.1.
- Update Prettier from 3.9.6 to 3.9.9.
- Accept the corresponding lockfile updates and record verification evidence.

Out of scope:

- Relaxing ESLint, html-validate, Prettier, or TypeScript configuration.
- Changing renderer behavior, snapshots, or the generated Action artifact.
- Updating unrelated direct dependencies.
- Bypassing the repository's release-age or vulnerability policies.

## Acceptance Criteria

1. The manifest and lockfile resolve ESLint 10.11.0,
   `eslint-plugin-html` 8.2.1, html-validate 11.16.1, and Prettier 3.9.9.
2. A frozen lockfile install succeeds without further lockfile changes.
3. Prototype linting proves that the processor fix is compatible with ESLint
   10.11.0.
4. HTML validation, type checking, Action builds, distribution verification,
   formatting, and all tests pass through `pnpm run preflight`.
5. All required GitHub checks pass on the final head and current-head Codex
   review has no unresolved blocking findings.

## Negative Scenarios

- Validation configuration is weakened to accommodate a dependency regression.
- ESLint 10.11.0 is paired with the incompatible `eslint-plugin-html` 8.2.0.
- The frozen install rewrites the lockfile unexpectedly.
- The regenerated Action distribution differs from the checked-in artifact.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm run preflight` completes with all 142 tests passing.
- `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are green.
- GitHub reports no unresolved review threads before merge.
