# Spec: GitHub Actions maintenance

## Goal

Adopt `pnpm/action-setup` v6.1.0 and
`anthropics/claude-code-action` v1.0.217 while preserving the repository's
existing workflow behavior and immutable action pins.

## Scope

In scope:

- Update the `pnpm/action-setup` commit in CI and PR Guard.
- Update the `anthropics/claude-code-action` commit in the Claude agent and
  dormant Claude review workflows.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Changing workflow triggers, permissions, inputs, secrets, or prompts.
- Enabling the non-operational Claude review backend.
- Updating unrelated actions, package dependencies, or product code.

## Acceptance Criteria

1. Both `pnpm/action-setup` references are pinned to
   `ea17c68df8912ef543352723c149a84f56e3d413` for v6.1.0.
2. Both `anthropics/claude-code-action` references are pinned to
   `9c5ddab2e6d17b83ea679153b31f1d5f023cf636` for v1.0.217.
3. The final diff changes no workflow behavior around those references.
4. `pnpm run preflight` and all required GitHub checks pass on the final head.
5. A current-head Codex review has no unresolved blocking findings or review
   threads.

## Negative Scenarios

- A mutable tag replaces a full commit SHA.
- The update changes workflow policy or activates the dormant Claude review
  backend.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are green.
- GitHub reports no unresolved review threads before merge.
