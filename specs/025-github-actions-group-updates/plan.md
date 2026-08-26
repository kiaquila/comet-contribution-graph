# Implementation Plan: GitHub Actions group updates

1. Take the Dependabot grouped update on current `main`.
2. Confirm each repinned SHA still carries its version comment and that no
   workflow logic changed.
3. Run the full preflight chain, which formats and validates the workflow
   files.
4. Add feature memory and durable dependency-maintenance evidence.
5. Publish the final head, request Codex review from the maintainer account,
   and clear all gates before merge.
