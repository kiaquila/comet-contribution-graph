# Implementation Plan: TypeScript v7

1. Rebase the Dependabot update on current `main`.
2. Install TypeScript v7; compile the Action source with it before bundling the
   emitted JavaScript because the current NCC ts-loader does not support the
   TypeScript 7 API; then run the full preflight chain.
3. Add feature memory and durable dependency-maintenance evidence.
4. Publish the final head, request Codex review from the maintainer account,
   and clear all gates before merge.
