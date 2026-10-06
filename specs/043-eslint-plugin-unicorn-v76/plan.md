# Plan: eslint-plugin-unicorn v76

1. Merge current `main` into the Dependabot branch.
2. Resolve the lockfile conflict with Unicorn v76 and `source-map-js` 1.2.2.
3. Confirm the manifest and lockfile diff is limited to Unicorn v76 and its
   changed transitive graph.
4. Add complete feature memory and update the durable maintenance ledger.
5. Run a frozen install and the full local preflight chain.
6. Publish final HEAD, request Codex review, resolve findings, and confirm all
   GitHub gates are green.
7. Hold merge-ready state for two minutes and merge PR #53.

## Compatibility Notes

- Unicorn v75 adds rules, but this repository explicitly enables only
  `unicorn/no-array-callback-reference`; no preset expansion is in scope.
- Unicorn v76 changes defaults for options on several unrelated rules. The
  repository does not enable those rules, so the compatibility test remains
  loading and executing the existing flat config unchanged.
- Upstream requires Node 22+ and ESLint 10.4+; the repository uses Node 24+ and
  ESLint 10.10.0.

## Risks

- A major plugin update could remove or alter the configured rule; prototype
  linting is the primary compatibility check.
- Conflict resolution could discard the security fix merged through PR #51;
  the final lockfile and OSV gate must prove it remains.
- A later push invalidates final-head review evidence and the stability hold.
