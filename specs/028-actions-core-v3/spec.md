# Feature Specification: @actions/core v3

## Goal

Upgrade `@actions/core` from v1 to v3 so the Action entrypoint uses the current
toolkit runtime API.

## Scope

- Apply the Dependabot `@actions/core` major update on the current `main` base.
- Verify the input, output, and failure calls used by `src/action.ts` against
  the v3 API.
- Rebuild the bundled Action distribution in `dist-action/`.
- Record feature memory and durable maintenance evidence.

## Acceptance criteria

- `pnpm run preflight` passes, including `check:ts`, `check:dist`, and the
  Action entrypoint tests.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not change Action inputs, outputs, or `action.yml` behavior as part of
  this upgrade.
