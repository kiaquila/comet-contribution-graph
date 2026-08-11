# Implementation Plan: html-validate v11

1. Rebase the Dependabot update on current `main` and regenerate the lockfile
   only as needed to preserve the current ESLint dependency graph.
2. Run the full preflight chain, including HTML validation.
3. Add feature memory and durable dependency-maintenance evidence.
4. Publish the final head, request Codex review from the maintainer account,
   and wait for all review gates before merge.
