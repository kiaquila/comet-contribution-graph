# Spec: npm minor and patch maintenance

## Goal

Adopt the grouped Dependabot updates for `@types/node`, ESLint, `globals`, and
html-validate while preserving the repository's build and validation behavior.

## Scope

In scope:

- Update `@types/node` from 26.4.0 to 26.4.1.
- Resolve ESLint 10 from 10.9.1 to 10.10.0.
- Resolve `globals` 17 from 17.11.0 to 17.12.0.
- Update html-validate from 11.11.0 to 11.14.0.
- Accept the corresponding transitive lockfile updates.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Relaxing TypeScript, ESLint, or html-validate configuration.
- Changing application behavior or generated Action output.
- Updating unrelated direct dependencies.

## Acceptance Criteria

1. The manifest and lockfile resolve the four requested versions.
2. A frozen lockfile install succeeds without further lockfile changes.
3. Type checking, prototype linting, HTML validation, Action build, distribution
   verification, formatting, and tests all pass through `pnpm run preflight`.
4. All required GitHub checks pass on the final head.
5. A current-head Codex review has no unresolved blocking findings or review
   threads.

## Negative Scenarios

- Validation configuration is weakened to accommodate a dependency regression.
- The regenerated Action distribution differs from the checked-in artifact.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are green.
- GitHub reports no unresolved review threads before merge.
