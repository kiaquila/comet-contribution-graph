# Tasks: eslint-plugin-unicorn v74

## Implementation

- [x] T001 Merge the current `main` base into the Dependabot branch.
- [x] T002 Resolve the lockfile conflict by regenerating Unicorn v74 on top of
      the PR #44 dependency set.
- [x] T003 Confirm the final dependency diff preserves ESLint 10.10.0,
      `globals` 17.12.0, html-validate 11.14.0, and `@types/node` 26.4.1.
- [x] T004 Add complete feature memory and durable maintenance evidence.

## Verification

- [x] T005 Complete a frozen lockfile install and run `pnpm run preflight`
      (115 tests passed).
- [ ] T006 Publish the final head and request current-head Codex review.
- [ ] T007 Confirm every required GitHub gate is green and every review thread
      is resolved.
- [ ] T008 Observe the two-minute merge-ready hold and merge PR #45.

## Decision

- Keep lint policy unchanged. Resolve the branch from current `main` and treat
  any new lint failure as a compatibility issue rather than suppressing it.
