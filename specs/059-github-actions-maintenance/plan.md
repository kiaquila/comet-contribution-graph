# Plan: GitHub Actions maintenance

1. Inspect PR #70 against the current `main` base and confirm both official
   release tags resolve to Dependabot's pinned commits.
2. Review the upstream breaking-change notes for Claude Code Action 1.0.273
   through 1.0.276 and preserve the prior strict-tool permission behavior.
3. Keep the three immutable workflow reference updates and add only the
   documented compatibility flag required by the new default session mode.
4. Add the required feature memory and durable dependency-maintenance record.
5. Run the full local preflight chain.
6. Publish the final head and request one trusted Codex review for that SHA.
7. Confirm every required check, review thread, and mergeability condition,
   observe the two-minute hold, then merge through the repository's permitted
   method.

## Risks

- Claude Code Action 1.0.273 changes the default permission mode, so accepting
  the Dependabot pin without an explicit compatibility flag would make the
  existing `--allowedTools` lists non-strict.
- Upstream action behavior may regress despite patch releases; the complete
  preflight and final-head review provide the verification boundary.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
