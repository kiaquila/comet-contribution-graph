# Spec: Claude Code Action maintenance

## Goal

Adopt `anthropics/claude-code-action` v1.0.231 in both repository-owned Claude
workflows while preserving their existing control-plane behavior, and clear the
current OSV gate by raising the existing `undici` security override to 6.28.1.

## Scope

In scope:

- Preserve Dependabot's immutable `anthropics/claude-code-action` commit SHA
  update in `.github/workflows/claude-agent.yml` and
  `.github/workflows/claude-review.yml`.
- Update `docs_comet/project/devops/dependency-maintenance.md` and record the
  dependency-maintenance intent and verification evidence.
- Raise the existing `undici` override and lockfile resolution from 6.28.0 to
  6.28.1, then rebuild the checked-in Action distribution.

Out of scope:

- Enabling the non-operational Claude review backend.
- Changing workflow triggers, permissions, inputs, secrets, or agent prompts.
- Updating unrelated GitHub Actions or product code.
- Relaxing the OSV gate or adding an `undici` runtime dependency.

## User Stories

### User Story 1

As the repository maintainer, I want the Claude Code Action pinned to the
current patch release so that the dormant and active workflow definitions stay
maintained without changing repository policy.

## Acceptance Criteria

1. Given both Claude workflows, when their action references are inspected,
   then each is pinned to commit
   `cfc3eb22bfed5c26ef66e3223c982af27e4524de` for v1.0.231.
2. Given the dependency-only scope, when the final diff is inspected, then no
   workflow trigger, permission, input, secret, or prompt has changed, and the
   durable maintenance record names v1.0.231.
3. Given the final branch head, when `pnpm run preflight` and GitHub checks run,
   then they pass without weakening validation.
4. Given a trusted maintainer review request for the final head, when Codex
   reviews the PR, then no unresolved blocking finding remains.
5. Given the final lockfile and Action bundle, when OSV and distribution checks
   run, then `GHSA-3wwx-pv8p-q78v` is absent and generated output is current.

## Negative Scenarios

1. Given a mutable action tag or a change that activates the disabled Claude
   review path, when the update is reviewed, then it must be rejected rather
   than accepted as routine maintenance.
2. Given a proposed vulnerability workaround that suppresses OSV or changes
   unrelated dependencies, when the diff is reviewed, then it must be rejected.

## Requirements

- FR-001: Both action references must remain pinned to the same immutable
  release commit.
- FR-002: Existing workflow policy and execution inputs must remain unchanged.
- FR-003: The final head must satisfy the repository's local and GitHub gates.
- FR-004: The dependency graph must resolve `undici` to 6.28.1 or newer within
  the existing major line.

## Success Criteria

- SC-001: `pnpm run preflight` succeeds on the final head.
- SC-002: `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are
  green before merge.
- SC-003: GitHub reports no unresolved review threads before merge.

## Assumptions

- GitHub's tag API resolves the official annotated tag v1.0.231 to commit
  `cfc3eb22bfed5c26ef66e3223c982af27e4524de`.
