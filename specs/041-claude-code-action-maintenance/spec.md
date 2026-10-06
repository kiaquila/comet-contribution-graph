# Spec: Claude Code Action 1.0.236 maintenance

## Goal

Update both repository-owned Claude workflows from
`anthropics/claude-code-action` 1.0.231 to 1.0.236 while preserving their
existing control-plane behavior.

## Scope

In scope:

- Keep Dependabot's immutable action SHA update in `.github/workflows/claude-agent.yml`
  and `.github/workflows/claude-review.yml`.
- Record the maintenance intent and verification evidence.

Out of scope:

- Enabling the non-operational Claude review backend.
- Changing workflow triggers, permissions, inputs, secrets, or prompts.
- Updating unrelated dependencies or product code.

## Acceptance Criteria

1. Both Claude workflows pin `anthropics/claude-code-action` to
   `8ce9314fa9a404564fa7e954cd84f25bcba2b829` for v1.0.236.
2. No workflow behavior changes beyond the immutable action reference.
3. Repository preflight and all required GitHub checks pass.
4. Final-head Codex review has no unresolved blocking findings.

## Negative Scenarios

1. A mutable action tag or an unrelated workflow-policy change must be rejected.
2. Validation or branch protection must not be relaxed to land the update.

## Success Criteria

- `pnpm run preflight` succeeds on the final head.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
