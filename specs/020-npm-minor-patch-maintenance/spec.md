# 020 — npm minor and patch maintenance

## Goal

Apply the grouped development-dependency updates for `@vercel/ncc` and
`prettier` while keeping generated Action output and repository checks aligned.

## Scope

In scope:

- Update `@vercel/ncc` from `^0.38.0` to `^0.44.1`.
- Update `prettier` from `^3.8.1` to `^3.9.6`.
- Refresh committed Action output only if the new NCC compiler changes it.
- Record maintenance and verification evidence.

Out of scope:

- Unrelated direct dependencies, runtime behavior, or formatter policy.

## Acceptance Criteria

1. Package and lockfile changes are limited to the two grouped updates.
2. `dist-action/` matches the upgraded NCC output when it changes.
3. The final head has green required checks, a healthy preview, and no
   unresolved Codex P0–P2 findings.

## Negative Scenarios

- No package outside the Dependabot group is upgraded.
- Stale generated output cannot pass the distribution check.

## Verification Evidence

- `pnpm run preflight` passes after rebuilding the action bundle.
- GitHub reports green `baseline-checks`, `guard`, `AI Review`, and
  `osv-scan` on the final head.
