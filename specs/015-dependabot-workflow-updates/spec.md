# 015 — Dependabot workflow updates

## Goal

Apply the pending minor and patch GitHub Actions updates while retaining the
repository's CI, review, and supply-chain checks.

## Scope

In scope:

- Update `anthropics/claude-code-action` from `1.0.99` to `1.0.183`.
- Update `google/osv-scanner-action/osv-scanner-action` from `2.3.5` to
  `2.3.8`.
- Record the maintenance and verification contract for Dependabot workflow
  updates.

Out of scope:

- Changing workflow behavior, review-agent policy, or Dependabot scheduling.
- Updating unrelated dependencies.

## Acceptance Criteria

1. The three affected workflow files reference only the intended updated action
   versions.
2. The required GitHub checks and the Vercel preview pass for the final PR
   head.
3. A trusted Codex review is requested for the final PR head and has no
   unresolved P0–P2 findings.

## Negative Scenarios

- No workflow gains an unpinned third-party action reference.
- A new push does not reuse review evidence from a previous head SHA.

## Verification Evidence

- `pnpm run preflight` succeeds on the final branch.
- GitHub reports green `baseline-checks`, `guard`, `AI Review`, and
  `osv-scan` for the final head.
