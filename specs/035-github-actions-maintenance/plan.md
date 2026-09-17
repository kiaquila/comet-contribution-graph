# Plan: GitHub Actions maintenance

1. Inspect the grouped Dependabot diff against the current `main` base.
2. Confirm all updated actions remain pinned to the expected immutable release
   commits and that surrounding workflow configuration is unchanged.
3. Add complete feature memory and update the durable dependency-maintenance
   ledger.
4. Run the full local preflight chain.
5. Publish the final head, request Codex review from the maintainer account,
   resolve all findings, and confirm every GitHub gate is green.
6. Hold the merge-ready state for two minutes and merge PR #43.

## Risks

- Upstream action regressions can affect CI or automation despite the narrow
  version-only diff; the full preflight and GitHub workflow matrix provide the
  verification boundary.
- Any later push invalidates current-head review evidence and restarts the
  review and stability-hold sequence.
