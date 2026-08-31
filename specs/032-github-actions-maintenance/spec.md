# Feature Specification: GitHub Actions maintenance

## Goal

Apply the grouped Dependabot GitHub Actions update for
`anthropics/claude-code-action` 1.0.202 and
`google/osv-scanner-action` 2.5.1 while preserving repository workflow policy.

## Scope

- Update only the immutable action SHAs in the Claude agent, Claude review,
  and OSV Scan workflows.
- Keep all actions pinned to release commit SHAs rather than mutable tags.
- Record feature memory and durable dependency-maintenance evidence.

## Acceptance criteria

- `pnpm run preflight` passes on the final head.
- The final PR head receives a current-head Codex review with no blocking
  findings.
- All required GitHub checks are green before merge.

## Negative scope

- Do not enable the non-operational Claude review backend, alter trigger
  permissions, or change scanner arguments as part of this dependency update.
