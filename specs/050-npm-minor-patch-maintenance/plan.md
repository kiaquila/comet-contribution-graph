# Plan: npm minor and patch maintenance

1. Merge the current `main` base into the Dependabot branch and inspect the
   combined manifest and lockfile.
2. Confirm the requested ESLint and html-validate versions while retaining the
   current base's security-fixed transitive resolutions.
3. Add complete feature memory and update the durable dependency-maintenance
   ledger.
4. Install from the frozen lockfile and run the full local preflight chain.
5. Publish the final head and request one trusted Codex review for that SHA.
6. Leave CI/review waiting, merge, and close/archive handling to the external
   automation.

## Risks

- Tooling updates can change lint or HTML-validation behavior; the complete
  preflight chain is the compatibility boundary.
- Merging a newer base can accidentally regress lockfile security resolutions;
  the final lockfile and OSV scan must retain the patched versions.
- Any later push invalidates current-head review evidence and requires a new
  trusted review request for the new SHA.
