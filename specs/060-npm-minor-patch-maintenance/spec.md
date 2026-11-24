# Spec: npm minor and patch maintenance

## Goal

Adopt the grouped Dependabot updates for ESLint 10.15.0, html-validate 11.21.1,
and Prettier 3.10.1 while preserving the repository's current lint,
validation, formatting, build, and security policies.

## Scope

In scope:

- Update the three direct development dependencies and their lockfile
  resolutions.
- Accept the corresponding transitive ESLint and minimatch lockfile updates.
- Merge the current base so the preceding GitHub Actions maintenance and its
  permission-mode compatibility fix remain present.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Changing ESLint flat config, enabled rules, plugin policy, or severities.
- Changing html-validate rules, presets, or severities.
- Changing Prettier configuration or reformatting unrelated files.
- Updating product behavior, runtime dependencies, or generated Action output.

## Acceptance Criteria

1. The manifest and lockfile resolve ESLint 10.15.0, html-validate 11.21.1,
   and Prettier 3.10.1.
2. ESLint's peer snapshot for `eslint-plugin-unicorn` resolves against
   ESLint 10.15.0 without changing the plugin version or rule configuration.
3. The lockfile accepts only the transitive changes required by the grouped
   update, including `@eslint/config-array` 0.23.6 and `minimatch` 11.0.8.
4. The existing Node 24 environment satisfies ESLint's
   `^20.19.0 || ^22.13.0 || >=24` and html-validate's
   `^22.22.0 || >=24.8.0` engine requirements.
5. A frozen lockfile install succeeds without further lockfile changes.
6. Existing HTML validation, prototype linting, formatting, Action
   distribution checks, and the complete `pnpm run preflight` chain pass
   without configuration changes.
7. All required GitHub checks pass on the final head.
8. A current-head Codex review has no unresolved blocking findings or threads.

## Negative Scenarios

- Lint, validation, or formatting configuration is weakened to accommodate a
  dependency regression.
- The current base's workflow maintenance or security fixes are lost while
  updating the branch.
- A frozen install rewrites the lockfile or resolves unexpected direct
  versions.
- Prettier rewrites checked-in files as an unreviewed side effect of the
  version update.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `pnpm install --frozen-lockfile` and `pnpm run preflight` succeed on the final
  local implementation.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
