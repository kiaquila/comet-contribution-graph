# Implementation Plan: npm minor and patch maintenance

1. Take the grouped Dependabot update on current `main`.
2. Install the updated development dependencies.
3. Rebuild `dist-action/` with the new bundler and commit the regenerated
   output alongside the dependency change.
4. Run the full preflight chain, including HTML validation and the
   distribution check.
5. Add feature memory and durable dependency-maintenance evidence.
6. Publish the final head, request Codex review from the maintainer account,
   and clear all gates before merge.
