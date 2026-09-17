# Plan: eslint-plugin-unicorn v74

1. Merge the current `main` base into the Dependabot branch.
2. Resolve the overlapping lockfile update from PR #44 by regenerating the v74
   resolution on top of the current dependency set.
3. Confirm the resulting manifest and lockfile diff is limited to Unicorn v74
   and its changed transitive package.
4. Add complete feature memory and update the durable dependency-maintenance
   ledger.
5. Run a frozen lockfile install and the full local preflight chain.
6. Publish the final head, request Codex review from the maintainer account,
   resolve all findings, and confirm every GitHub gate is green.
7. Hold the merge-ready state for two minutes and merge PR #45.

## Risks

- Unicorn v74 is a major release and could remove or change a configured rule;
  prototype linting is the primary compatibility check.
- Regenerating the conflicted lockfile could discard the toolchain versions
  merged through PR #44; the final diff must be reviewed against current
  `main`.
- Any later push invalidates current-head review evidence and restarts the
  review and stability-hold sequence.
