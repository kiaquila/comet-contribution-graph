# Plan: eslint-plugin-unicorn v78 maintenance

1. Inspect PR #64 against the current `main` base and review the official v78
   release notes and compatibility requirements.
2. Merge the current `main` base so the preceding security remediation and
   feature memory remain intact.
3. Preserve Dependabot's direct version and lockfile update without changing
   the repository's lint configuration.
4. Add the required feature memory and durable dependency-maintenance record.
5. Complete a frozen install, run prototype linting, and run the full preflight
   chain.
6. Publish the final head and request one trusted Codex review for that SHA.
7. Confirm every required check, review thread, and mergeability condition,
   observe the two-minute hold, then merge through the repository's permitted
   method.

## Risks

- v78 reports some comment-containing patterns that earlier versions skipped;
  explicit prototype linting is the compatibility boundary for this repository.
- The plugin adds parser and optional TypeScript peer dependencies, increasing
  lockfile surface without changing runtime output.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
