# Implementation Plan: GitHub Actions maintenance

1. Take the grouped Dependabot action updates on the current `main` base.
2. Confirm each workflow remains SHA-pinned and its surrounding configuration
   is unchanged.
3. Run the complete preflight chain and record durable maintenance evidence.
4. Publish the final head, request Codex review from the maintainer account,
   and clear all gates before merge.
