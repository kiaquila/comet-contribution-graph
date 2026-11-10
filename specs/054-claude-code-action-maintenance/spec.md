# Spec: Claude Code Action 1.0.266 maintenance

## Goal

Update both repository-owned Claude workflows from
`anthropics/claude-code-action` 1.0.263 to 1.0.266 while preserving their
existing control-plane behavior.

## Scope

In scope:

- Keep Dependabot's immutable action SHA update in `.github/workflows/claude-agent.yml`
  and `.github/workflows/claude-review.yml`.
- Record the maintenance intent and verification evidence.

Out of scope:

- Enabling the non-operational Claude review backend.
- Changing workflow triggers, permissions, inputs, secrets, prompts, security
  policy, or schedules.
- Updating unrelated dependencies or product code.

## Acceptance Criteria

1. Both Claude workflows pin `anthropics/claude-code-action` to
   `d535f5172dec02b204866b393d6b20b9b2aaf98d` for v1.0.266.
2. No workflow behavior changes beyond the immutable action reference.
3. Repository preflight and all required GitHub checks pass.
4. Final-head Codex review has no unresolved blocking findings.

## Negative Scenarios

1. A mutable action tag or an unrelated workflow-policy change must be rejected.
2. Validation, permissions, security policy, or branch protection must not be
   relaxed to land the update.

## Success Criteria

- `pnpm run preflight` succeeds on the final local head.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
