# Implementation Plan: @actions/core v3

1. Take the Dependabot update on current `main`.
2. Install v3 and reconcile the toolkit API surface used by the Action
   entrypoint, including any type-resolution changes it introduces.
3. Rebuild `dist-action/` and confirm the tracked bundle matches the build.
4. Add feature memory and durable dependency-maintenance evidence.
5. Publish the final head, request Codex review from the maintainer account,
   and clear all gates before merge.
