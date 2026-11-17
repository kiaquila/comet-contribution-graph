# Plan: html-validate 11.21 maintenance

1. Inspect PR #69 against the current `main` base and review the official
   changelog and compatibility requirements from 11.18.0 through 11.21.0.
2. Merge the current `main` base so the preceding workflow and feature-memory
   changes remain present.
3. Confirm the requested direct version and corresponding lockfile
   deduplication without changing validation configuration.
4. Add complete feature memory and update the durable dependency-maintenance
   ledger.
5. Complete a frozen install, run HTML validation, and run the full local
   preflight chain.
6. Publish the final head and request one trusted Codex review for that SHA.
7. Confirm every required check, review thread, and mergeability condition,
   observe the two-minute hold, then merge through the repository's permitted
   method.

## Risks

- Minor releases include rule and HTML metadata fixes that can expose invalid
  markup; the existing prototype validation and complete preflight chain are
  the compatibility boundary.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
