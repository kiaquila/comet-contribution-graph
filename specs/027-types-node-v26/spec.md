# Feature Specification: @types/node v26

## Goal

Upgrade `@types/node` from v24 to v26 so renderer and Action type checking
matches the Node 24+ runtime contract declared in `package.json`.

## Scope

- Apply the Dependabot `@types/node` major update on the current `main` base.
- Verify strict type checking of `src/` under the new declarations.
- Record feature memory and durable maintenance evidence.

## Acceptance criteria

- `pnpm run preflight` passes, including `check:ts` and the Action build.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not weaken `tsconfig.json` strictness or add type assertions to hide new
  diagnostics.
