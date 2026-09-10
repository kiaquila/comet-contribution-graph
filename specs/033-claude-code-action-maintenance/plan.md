# Plan: Claude Code Action maintenance

## Summary

Keep the Dependabot version bump intact, document its narrow control-plane
scope, and validate the complete repository gate chain before requesting a
fresh final-head Codex review.

## Technical Context

- runtime: GitHub Actions workflow definitions
- dependencies: `anthropics/claude-code-action` v1.0.211
- product paths: `.github/workflows/claude-agent.yml`,
  `.github/workflows/claude-review.yml`,
  `docs_comet/project/devops/dependency-maintenance.md`
- data changes: none

## Scope Boundaries

- in scope: two immutable action-SHA updates, durable dependency-maintenance
  documentation, and feature memory
- out of scope: workflow behavior, permissions, prompts, secrets, other
  dependencies, and product code

## Constitution Check

- Spec-first: this feature-memory triad records the maintenance intent before
  any follow-up edit.
- Testable boundaries: exact-SHA and diff checks prove the dependency-only
  scope; preflight covers repository validation.
- PR-only: all changes remain on PR #41's head branch.
- Simplicity: no new abstraction or workflow step is introduced.
- Deployability: the existing CI, Action bundle, and preview checks must remain
  green.

## Complexity Tracking

No new runtime or architectural complexity is introduced.

## Verification

| Acceptance criterion | Evidence                                                      |
| -------------------- | ------------------------------------------------------------- |
| AC-001               | GitHub tag API plus an exact diff of both workflow references |
| AC-002               | Exact workflow diff plus the durable maintenance record       |
| AC-003               | `pnpm run preflight` and final GitHub check rollup            |
| AC-004               | Current-head Codex review and review-thread GraphQL query     |

Negative scenario evidence:

- Confirm the diff contains full commit SHAs only and does not change the
  disabled Claude review policy or any workflow configuration around the
  action steps.

## Risks

- Upstream action behavior may regress despite a patch-level release; the full
  repository preflight and AI review reduce that risk.
- A later push would stale current review evidence; request Codex review only
  after the final commit is published.
