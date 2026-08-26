# Implementation Plan: globals v17

1. Take the Dependabot update on current `main`.
2. Install v17 and confirm the global keys used by the lint configuration
   still exist.
3. Run the full preflight chain, which includes prototype linting.
4. Add feature memory and durable dependency-maintenance evidence.
5. Publish the final head, request Codex review from the maintainer account,
   and clear all gates before merge.
