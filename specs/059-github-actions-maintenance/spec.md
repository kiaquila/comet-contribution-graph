# Spec: GitHub Actions maintenance

## Goal

Adopt the grouped Dependabot updates for `anthropics/claude-code-action`
1.0.276 and `google/osv-scanner-action/osv-scanner-action` 2.7.1 while
preserving the repository's existing workflow behavior and security
boundaries.

## Scope

In scope:

- Keep Dependabot's immutable Claude Code Action SHA update in the Claude
  implementation and dormant review workflows.
- Keep Dependabot's immutable OSV Scanner Action SHA update in the fail-closed
  supply-chain workflow.
- Explicitly retain the earlier strict-tool permission behavior required by
  the Claude Code Action 1.0.273 upgrade notes.
- Record the maintenance intent and verification evidence.

Out of scope:

- Enabling the non-operational Claude review backend.
- Changing workflow triggers, permissions, inputs, secrets, prompts, review
  policy, or schedules.
- Updating unrelated dependencies or product code.

## Acceptance Criteria

1. Both Claude workflows pin `anthropics/claude-code-action` to
   `f3b070c88125d33dbae5653df5f143101d4ea9dc` for v1.0.276.
2. The OSV workflow pins `google/osv-scanner-action/osv-scanner-action` to
   `32d3cd482bdadfb38b186c0ad1b031902d55d932` for v2.7.1.
3. Both comment-driven Claude workflows pass `--permission-mode acceptEdits`
   before their existing `--allowedTools` arguments, preserving the earlier
   strict allow-list behavior documented by the upstream upgrade notes.
4. No workflow policy changes beyond the three immutable action references
   and the compatibility flag required for the new Claude Action default.
5. Repository preflight and all required GitHub checks pass.
6. Final-head Codex review has no unresolved blocking findings.

## Negative Scenarios

1. A mutable action tag or unrelated workflow-policy change must be rejected.
2. Leaving Claude sessions in the new default auto mode must be rejected
   because tools outside `--allowedTools` could run after safety review.
3. Validation, permissions, security policy, or branch protection must not be
   relaxed to land the update.
4. Review evidence from an earlier head must not be treated as current.

## Success Criteria

- `pnpm run preflight` succeeds on the final local head.
- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green.
- GitHub reports no unresolved review threads before merge.
