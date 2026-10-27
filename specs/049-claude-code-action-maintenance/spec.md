# Spec: Claude Code Action 1.0.254 maintenance

## Goal

Update both repository-owned Claude workflows from
`anthropics/claude-code-action` 1.0.248 to 1.0.254 while preserving their
existing control-plane behavior and clearing the vulnerabilities reported by
the required OSV scan.

## Scope

In scope:

- Keep Dependabot's immutable action SHA update in `.github/workflows/claude-agent.yml`
  and `.github/workflows/claude-review.yml`.
- Record the maintenance intent and verification evidence.
- Raise the existing transitive dependency floors to `fast-uri` 3.1.9 and
  `undici` 6.29.1, the fixed versions named by OSV.

Out of scope:

- Enabling the non-operational Claude review backend.
- Changing workflow triggers, permissions, inputs, secrets, prompts, security
  policy, or schedules.
- Updating unrelated dependencies or product code.

## Acceptance Criteria

1. Both Claude workflows pin `anthropics/claude-code-action` to
   `db77d4d3c98f3f6380e7cd45ffba2342a3dbde3c` for v1.0.254.
2. No workflow behavior changes beyond the immutable action reference.
3. The lockfile resolves `fast-uri` 3.1.9 or newer and `undici` 6.29.1 or
   newer without suppressing vulnerability scanning.
4. Repository preflight and all required GitHub checks pass.
5. Final-head Codex review has no unresolved blocking findings.

## Negative Scenarios

1. A mutable action tag or an unrelated workflow-policy change must be rejected.
2. Validation, permissions, security policy, or branch protection must not be
   relaxed to land the update.

## Success Criteria

- `pnpm run preflight` succeeds on the final local head.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
