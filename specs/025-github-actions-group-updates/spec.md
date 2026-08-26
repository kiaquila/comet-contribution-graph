# Feature Specification: GitHub Actions group updates

## Goal

Apply the grouped Dependabot GitHub Actions minor and patch update so pinned
action SHAs stay current without changing workflow behavior.

## Scope

- Repin `anthropics/claude-code-action` v1 in the Claude agent and Claude
  review workflows.
- Repin `google/osv-scanner-action/osv-scanner-action` from v2.3.8 to v2.5.0
  in the OSV scan workflow.
- Record feature memory and durable maintenance evidence.

## Acceptance criteria

- Workflow files keep commit-SHA pinning with a readable version comment.
- `pnpm run preflight` passes, including workflow formatting.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not change workflow triggers, permissions, or gate logic.
- Do not replace SHA pinning with floating tags.
