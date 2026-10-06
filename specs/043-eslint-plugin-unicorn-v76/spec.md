# Spec: eslint-plugin-unicorn v76

## Goal

Upgrade `eslint-plugin-unicorn` from v74 to v76 while preserving the
repository's prototype lint policy and ESLint 10.10.0 toolchain.

## Scope

In scope:

- Update the direct development dependency to `eslint-plugin-unicorn` v76.
- Resolve the lockfile on top of current `main`, including the patched
  `source-map-js` 1.2.2 resolution.
- Verify the configured `unicorn/no-array-callback-reference` rule still loads
  and passes without changing lint policy.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Enabling the new v75 rule set or changing options introduced in v76.
- Removing, relaxing, or replacing existing lint rules.
- Updating unrelated dependencies or product behavior.

## Acceptance Criteria

1. `package.json` requests `eslint-plugin-unicorn` v76 and the lockfile resolves
   v76 against ESLint 10.10.0.
2. The merged lockfile retains `source-map-js` 1.2.2 and its exact release-age
   exception.
3. A frozen install, prototype lint, and the full preflight chain pass without
   lint configuration changes.
4. All required GitHub checks pass on final HEAD.
5. Final-head Codex review has no unresolved blocking findings or threads.

## Negative Scenarios

- Lint configuration or prototype source is weakened to accommodate the major
  update.
- Lockfile conflict resolution reintroduces vulnerable `source-map-js` 1.2.1.
- Review evidence from an earlier HEAD is treated as current.

## Success Criteria

- `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are green.
- GitHub reports no unresolved review threads before merge.
