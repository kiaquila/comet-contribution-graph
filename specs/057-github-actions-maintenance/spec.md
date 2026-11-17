# Spec: GitHub Actions maintenance

## Goal

Adopt the grouped Dependabot updates for `pnpm/action-setup` 6.1.1 and
`anthropics/claude-code-action` 1.0.269 while preserving the repository's
existing workflow behavior and security boundaries.

## Scope

In scope:

- Keep Dependabot's immutable `pnpm/action-setup` SHA update in CI and PR Guard.
- Keep Dependabot's immutable `anthropics/claude-code-action` SHA update in the
  Claude implementation and dormant review workflows.
- Record the maintenance intent and verification evidence.

Out of scope:

- Enabling the non-operational Claude review backend.
- Changing workflow triggers, permissions, inputs, secrets, prompts, security
  policy, or schedules.
- Updating unrelated dependencies or product code.

## Acceptance Criteria

1. CI and PR Guard pin `pnpm/action-setup` to
   `73e46992e05b19abd31f2f3c20e0e7370d762115` for v6.1.1.
2. Both Claude workflows pin `anthropics/claude-code-action` to
   `61a9c274fa7110a66dfafc1bbbced03833eb25fe` for v1.0.269.
3. No workflow behavior changes beyond the four immutable action references.
4. Repository preflight and all required GitHub checks pass.
5. Final-head Codex review has no unresolved blocking findings.

## Negative Scenarios

1. A mutable action tag or unrelated workflow-policy change must be rejected.
2. Validation, permissions, security policy, or branch protection must not be
   relaxed to land the update.
3. Review evidence from an earlier head must not be treated as current.

## Success Criteria

- `pnpm run preflight` succeeds on the final local head.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
