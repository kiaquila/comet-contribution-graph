# Dependency maintenance

> Audience: maintainers and agents. This document records the durable process
> for dependency-only pull requests.

Dependency upgrades can change build, runtime, or supply-chain behavior even
when the source diff is limited to version references. Keep each update scoped
to its proposed dependency, add complete feature memory, run preflight, and
request a human-authored current-head AI review before merge.

## Recorded updates

- `actions/checkout` v6 → v7: verified across all repository workflows by the
  required GitHub checks and a final-head Codex review.
- `actions/github-script` v8 → v9: verified in the Claude workflow files by
  the same required checks and final-head review process.
- `pnpm/action-setup` v4.3.0 → v6.0.10: verified in CI and PR Guard by the
  same required checks and final-head review process.
- `actions/setup-node` v4 → v7: verified in CI and PR Guard by the same
  required checks and final-head review process.
- `@vercel/ncc` v0.38.4 → v0.44.1 and Prettier v3.8.2 → v3.9.6: verified as
  a grouped development-dependency update, including the Action distribution
  check after rebuilding generated output.
- ESLint v9 → v10: requires the full lint and preflight chain before merge to
  validate compatibility with the repository's lint configuration.
- html-validate v10 → v11: requires the HTML validation and full preflight
  chain with the repository's Node runtime before merge.
- `@actions/exec` v1 → v3: requires Action-entrypoint tests and the bundled
  distribution check before merge.
- TypeScript v5 → v7: requires type checking, Action build, and the complete
  preflight chain before merge. The Action build compiles TypeScript first and
  bundles its emitted JavaScript because NCC v0.44.1 does not load TypeScript
  v7 directly.
- `anthropics/claude-code-action` v1 repin and
  `google/osv-scanner-action` v2.3.8 → v2.5.0: verified as a grouped GitHub
  Actions update by the required checks and a final-head Codex review; both
  actions stay pinned to commit SHAs.
- `globals` v16 → v17: requires prototype linting to confirm the global
  environment names used by the flat ESLint configuration still resolve.
- `@types/node` v24 → v26: requires strict type checking of the renderer, data
  layer, and Action entrypoint before merge.
- `@actions/core` v1 → v3: requires the Action-entrypoint tests and the bundled
  distribution check before merge. The v3 chain pulls `@actions/http-client` v4,
  whose type declarations no longer carry a `/// <reference types="node" />`
  directive, so `tsconfig.json` now names `node` in `types` instead of relying
  on that transitive reference to load the Node global declarations.
- `eslint-plugin-unicorn` v57 → v73: requires the prototype lint run to confirm
  the `unicorn/no-array-callback-reference` rule the flat configuration enables
  still exists in the new rule set.
