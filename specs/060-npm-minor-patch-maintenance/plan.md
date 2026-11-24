# Plan: npm minor and patch maintenance

1. Inspect PR #71 against the current `main` base and review the official
   release notes, package engines, and published integrity metadata.
2. Merge the current `main` base so the preceding workflow, feature-memory,
   and security changes remain present.
3. Confirm the requested direct versions and corresponding transitive lockfile
   changes without modifying repository configuration.
4. Add complete feature memory and update the durable dependency-maintenance
   ledger.
5. Complete a frozen install and run the full local preflight chain, including
   prototype linting, HTML validation, formatting, and Action distribution.
6. Publish the final head and request one trusted Codex review for that SHA.
7. Confirm every required check, review thread, and mergeability condition,
   observe the two-minute hold, then merge through the repository's permitted
   method.

## Risks

- ESLint minor releases can alter core rule behavior or transitive config
  resolution; the existing flat config and prototype lint run are the
  compatibility boundary.
- html-validate fixes can expose previously missed invalid markup; validation
  must pass without policy relaxation.
- Prettier 3.10 includes printer changes; formatting checks must pass without
  unrelated rewrites.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
