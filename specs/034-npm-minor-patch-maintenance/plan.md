# Plan: npm minor and patch maintenance

## Summary

Update PR #42 onto the post-PR-#41 `main`, preserve the four-package Dependabot
diff, document the exact maintenance scope, and verify every existing build and
validation gate before requesting final-head Codex review.

## Technical Context

- runtime: Node.js 24+ repository tooling
- dependencies: `@types/node` 26.4.0, ESLint 10.9.1,
  `eslint-plugin-html` 8.2.0, html-validate 11.11.0
- product paths: `package.json`, `pnpm-lock.yaml`,
  `docs_comet/project/devops/dependency-maintenance.md`
- data changes: none

## Scope Boundaries

- in scope: four grouped development-tooling resolutions, their lockfile
  relationships, durable documentation, and feature memory
- out of scope: validation configuration, source code, runtime dependencies,
  and unrelated generated output

## Constitution Check

- Spec-first: the feature-memory triad records the grouped maintenance scope
  before any compatibility fix is considered.
- Testable boundaries: manifest/lockfile diff inspection and full preflight
  cover the affected validation surfaces.
- PR-only: all changes remain on PR #42's head branch.
- Simplicity: no new dependency or abstraction is introduced beyond the
  Dependabot proposal.
- Deployability: the static build and checked-in Action distribution must stay
  reproducible and unchanged.

## Complexity Tracking

No new runtime or architectural complexity is introduced.

## Verification

| Acceptance criterion | Evidence                                                           |
| -------------------- | ------------------------------------------------------------------ |
| AC-001               | Exact `package.json` and `pnpm-lock.yaml` diff plus frozen install |
| AC-002               | `pnpm run preflight` on the final local head                       |
| AC-003               | `git diff origin/main...HEAD --stat` and changed-file inspection   |
| AC-004               | Current-head Codex evidence and review-thread GraphQL query        |

Negative scenario evidence:

- Confirm preflight passes with the existing ESLint, html-validate, TypeScript,
  test, and distribution configuration untouched.

## Risks

- New type declarations can expose compile failures; strict type checking is
  mandatory.
- Parser changes in lint and HTML-validation tools can reveal new diagnostics;
  existing rules must not be relaxed to make the update pass.
- A later push would stale review evidence; request Codex review only after
  the final commit is published.
