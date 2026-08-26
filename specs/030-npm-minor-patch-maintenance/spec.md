# Feature Specification: npm minor and patch maintenance

## Goal

Apply the grouped Dependabot minor and patch development-dependency update so
the build and validation toolchain stays current.

## Scope

- Update `@types/node`, `@vercel/ncc`, `eslint`, `globals`, and `html-validate`
  within the grouped update on the current `main` base.
- Rebuild the bundled Action distribution because the bundler changed.
- Record feature memory and durable maintenance evidence.

## Acceptance criteria

- `pnpm run preflight` passes, including `check:html` and `check:dist`.
- The regenerated `dist-action/` output matches the tracked bundle.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not skip the distribution check or commit a bundle that the build cannot
  reproduce.
