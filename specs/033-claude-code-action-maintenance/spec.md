# Spec: Claude Code Action maintenance

## Goal

Adopt `anthropics/claude-code-action` v1.0.211 in both repository-owned Claude
workflows while preserving their existing control-plane behavior.

## Scope

In scope:

- Update the immutable `anthropics/claude-code-action` commit SHA in
  `.github/workflows/claude-agent.yml` and
  `.github/workflows/claude-review.yml`.
- Record the dependency-maintenance intent and verification evidence.

Out of scope:

- Enabling the non-operational Claude review backend.
- Changing workflow triggers, permissions, inputs, secrets, or agent prompts.
- Updating unrelated GitHub Actions or product code.

## User Stories

### User Story 1

As the repository maintainer, I want the Claude Code Action pinned to the
current patch release so that the dormant and active workflow definitions stay
maintained without changing repository policy.

## Acceptance Criteria

1. Given both Claude workflows, when their action references are inspected,
   then each is pinned to commit
   `833fb0f8c9f6686b33d963a8bae0a94f4936ab2a` for v1.0.211.
2. Given the dependency-only scope, when the final diff is inspected, then no
   workflow trigger, permission, input, secret, or prompt has changed.
3. Given the final branch head, when `pnpm run preflight` and GitHub checks run,
   then they pass without weakening validation.
4. Given a trusted maintainer review request for the final head, when Codex
   reviews the PR, then no unresolved blocking finding remains.

## Negative Scenarios

1. Given a mutable action tag or a change that activates the disabled Claude
   review path, when the update is reviewed, then it must be rejected rather
   than accepted as routine maintenance.

## Requirements

- FR-001: Both action references must remain pinned to the same immutable
  release commit.
- FR-002: Existing workflow policy and execution inputs must remain unchanged.
- FR-003: The final head must satisfy the repository's local and GitHub gates.

## Success Criteria

- SC-001: `pnpm run preflight` succeeds on the final head.
- SC-002: `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are
  green before merge.
- SC-003: GitHub reports no unresolved review threads before merge.

## Assumptions

- GitHub's tag API resolves the official annotated tag v1.0.211 to commit
  `833fb0f8c9f6686b33d963a8bae0a94f4936ab2a`.
