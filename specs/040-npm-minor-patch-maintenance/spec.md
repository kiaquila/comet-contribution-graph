# Spec: npm minor and patch maintenance

## Goal

Adopt the compatible grouped Dependabot updates for `@types/node` and
html-validate while preserving the repository's build and validation behavior,
and defer ESLint 10.11 until its required processor fix clears the repository's
release-age policy.

## Scope

In scope:

- Update `@types/node` from 26.5.1 to 26.6.2.
- Update html-validate from 11.15.0 to 11.16.0.
- Keep ESLint at 10.10.0 because 10.11.0 crashes with
  `eslint-plugin-html` 8.2.0, while the upstream 8.2.1 fix for issue #342 is
  still blocked by the seven-day `minimumReleaseAge` policy.
- Accept the corresponding transitive lockfile updates.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Relaxing TypeScript, ESLint, or html-validate configuration.
- Changing application behavior or generated Action output.
- Updating unrelated direct dependencies.
- Bypassing or weakening `minimumReleaseAge` to install a too-recent package.

## Acceptance Criteria

1. The manifest and lockfile resolve `@types/node` 26.6.2, html-validate
   11.16.0, ESLint 10.10.0, and `eslint-plugin-html` 8.2.0.
2. A frozen lockfile install succeeds without further lockfile changes.
3. Type checking, prototype linting, HTML validation, Action build, distribution
   verification, formatting, and tests all pass through `pnpm run preflight`.
4. All required GitHub checks pass on the final head.
5. A current-head Codex review has no unresolved blocking findings or review
   threads.

## Negative Scenarios

- Validation configuration is weakened to accommodate a dependency regression.
- ESLint 10.11.0 is merged with the incompatible `eslint-plugin-html` 8.2.0.
- The release-age policy is bypassed to force-install `eslint-plugin-html`
  8.2.1 before it matures.
- The regenerated Action distribution differs from the checked-in artifact.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm run check:js` completes without changing lint configuration.
- `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are green.
- GitHub reports no unresolved review threads before merge.
