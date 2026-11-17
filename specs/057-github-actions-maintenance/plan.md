# Plan: GitHub Actions maintenance

1. Inspect PR #68 against the current `main` base and confirm both official
   release tags resolve to Dependabot's pinned commits.
2. Preserve the four immutable workflow reference updates without changing
   workflow behavior or policy.
3. Add the required feature memory and durable dependency-maintenance record.
4. Run the full local preflight chain.
5. Publish the final head and request one trusted Codex review for that SHA.
6. Confirm every required check, review thread, and mergeability condition,
   observe the two-minute hold, then merge through the repository's permitted
   method.

## Risks

- Upstream action behavior may regress despite patch releases; the complete
  preflight and final-head review provide the verification boundary.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
