# Plan: Claude Code Action 1.0.236 maintenance

## Summary

Preserve Dependabot's two immutable action-SHA updates, add the required
feature memory and durable maintenance record, raise the transitive
`source-map-js` security floor, then validate the complete gate chain before
requesting final-head Codex review.

## Scope Boundaries

- In scope: the two Claude workflow references, the narrow `source-map-js`
  security override and exact-version release-age exception, feature memory,
  and dependency maintenance documentation.
- Out of scope: workflow behavior, permissions, prompts, secrets, unrelated
  dependencies, and product code.

## Constitution Check

- Spec-first: this triad records the maintenance intent.
- PR-only: all changes remain on PR #51's head branch.
- Simplicity: no workflow step or abstraction is introduced.
- Deployability: existing validation and preview checks must remain green.

## Verification

- Inspect the workflow diff for the exact v1.0.236 SHA and no other behavior
  changes.
- Run `pnpm run preflight`.
- Confirm OSV no longer reports `GHSA-68fv-2mgg-jv7q`.
- Confirm the required GitHub checks, current-head Codex review, mergeability,
  and review-thread state before merge.

## Risks

- Upstream action behavior may regress despite a patch release; the complete
  preflight and AI review reduce that risk.
- Any later push stales review evidence, so Codex review must target final HEAD.
