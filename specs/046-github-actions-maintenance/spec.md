# Spec: GitHub Actions maintenance

## Goal

Adopt `anthropics/claude-code-action` v1.0.248 and
`google/osv-scanner-action/osv-scanner-action` v2.7.0 while preserving the
repository's workflow behavior and immutable action pins.

## Scope

In scope:

- Update both Claude workflow references to the v1.0.248 commit.
- Update the OSV scanner workflow reference to the v2.7.0 commit.
- Record the feature memory and durable dependency-maintenance entry required
  for this control-plane change.

Out of scope:

- Changing workflow triggers, permissions, inputs, secrets, prompts, policy, or
  schedules.
- Enabling the non-operational Claude review backend.
- Updating unrelated actions, package dependencies, or product code.

## Acceptance Criteria

1. Both `anthropics/claude-code-action` references are pinned to
   `1d6de8cb0c237e7c15e9e1bdf973826ebae490cc` for v1.0.248.
2. The OSV scanner action is pinned to
   `b1d267aea5211fa648d9d442fa64b90dbdcbdd36` for v2.7.0.
3. The final workflow diff changes no surrounding behavior.
4. `pnpm run preflight` and the required GitHub checks pass on the final head.
5. A current-head Codex review has no unresolved blocking findings or threads.

## Negative Scenarios

- A mutable tag replaces a full commit SHA.
- The update changes workflow policy or activates the dormant Claude review
  backend.
- The OSV scanner fails or does not complete and the workflow still passes.
- Review evidence from an earlier head is treated as current.

## Success Criteria

- `baseline-checks`, `guard`, `AI Review`, and `osv-scan` are green for the
  current head.
- GitHub reports no unresolved blocking review threads before merge.
