# Spec: GitHub Actions maintenance

## Goal

Adopt `anthropics/claude-code-action` v1.0.224 and
`google/osv-scanner-action/osv-scanner-action` v2.6.0 while preserving the
repository's workflow behavior and immutable action pins.

## Scope

In scope:

- Update both Claude workflow references to the v1.0.224 commit.
- Update the OSV scanner workflow reference to the v2.6.0 commit.
- Record feature memory and durable dependency-maintenance evidence.

Out of scope:

- Changing workflow triggers, permissions, inputs, secrets, or prompts.
- Enabling the non-operational Claude review backend.
- Updating unrelated actions, package dependencies, or product code.

## Acceptance Criteria

1. Both `anthropics/claude-code-action` references are pinned to
   `51db78a4b844e144f8d02425cb280435c04a3474` for v1.0.224.
2. The OSV scanner action is pinned to
   `a345acffa64b0eaede81a3d9aae6141214d9c8fc` for v2.6.0.
3. The final diff changes no surrounding workflow behavior.
4. `pnpm run preflight` and all required GitHub checks pass on the final head.
5. A current-head Codex review has no unresolved blocking findings or review
   threads.

## Negative Scenarios

- A mutable tag replaces a full commit SHA.
- The update changes workflow policy or activates the dormant Claude review
  backend.
- The OSV scanner fails or does not complete and the workflow still passes.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `baseline-checks`, `guard`, `AI Review`, `osv-scan`, and Vercel are green.
- GitHub reports no unresolved review threads before merge.
