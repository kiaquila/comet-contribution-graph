# Spec: html-validate 11.21 maintenance

## Goal

Update `html-validate` from 11.18.0 to 11.21.0 while preserving the
repository's HTML-validation policy and the current dependency security fixes.

## Scope

In scope:

- Update the direct development dependency and lockfile resolution to
  html-validate 11.21.0.
- Accept the corresponding `semver` 7.8.6 deduplication.
- Merge the current base so the preceding GitHub Actions maintenance remains
  present.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Changing `.htmlvalidate.json`, validation rules, presets, or severity.
- Adopting new html-validate APIs or rule options introduced after 11.18.0.
- Changing product behavior, generated Action output, or unrelated
  dependencies.

## Acceptance Criteria

1. The manifest and lockfile resolve html-validate 11.21.0.
2. The lockfile resolves the package's `semver` dependency to 7.8.6 without
   retaining the prior 7.8.5 snapshot.
3. The existing Node 24 validation environment satisfies the package's
   `^22.22.0 || >=24.8.0` engine requirement.
4. A frozen lockfile install succeeds without further lockfile changes.
5. Existing HTML validation and the complete `pnpm run preflight` chain pass
   without configuration changes.
6. All required GitHub checks pass on the final head.
7. A current-head Codex review has no unresolved blocking findings or threads.

## Negative Scenarios

- Validation configuration is weakened to accommodate a dependency regression.
- The current base's workflow maintenance or security fixes are lost while
  updating the branch.
- A frozen install rewrites the lockfile or resolves unexpected direct
  versions.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm run preflight` succeeds on the final local implementation.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
