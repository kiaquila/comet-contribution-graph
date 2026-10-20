# Plan: GitHub Actions maintenance

1. Inspect the grouped Dependabot diff against the current `main` base.
2. Confirm the updated actions remain pinned to the expected immutable release
   commits and that surrounding workflow configuration is unchanged.
3. Add the complete feature-memory triad required by the repository guard.
4. Run the full local preflight chain.
5. Publish the final head and request one trusted Codex review for that SHA.
6. Leave CI/review waiting, merge, and close/archive handling to the external
   automation.

## Risks

- Upstream action regressions can affect CI despite the version-only diff; the
  local preflight and GitHub workflow matrix provide the verification boundary.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
