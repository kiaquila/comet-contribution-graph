# Tasks: ESLint and html-validate maintenance

- [x] T001 Take the grouped Dependabot update on the current `main` base.
- [x] T002 Add complete feature memory and durable maintenance evidence.
- [x] T003 Run `pnpm run preflight` on the final head (115 tests passed).
- [ ] T004 Publish, request final-head Codex review, and clear all gates.

## Decision

- Keep the lint, HTML-validation, and product-source configuration unchanged:
  the update is accepted only if the existing validation surface passes.

## Negative scenario

- A newly introduced lint or HTML-validation incompatibility must fail
  preflight; no rule may be disabled merely to make the maintenance update
  pass.
