# Tasks: chore/ci-prototype-js-validation

- [x] Create `specs/chore-ci-js-validation/{spec,plan,tasks}.md`
- [ ] Write `scripts/check-prototype-js.mjs`
- [ ] Write `playwright.config.mjs`
- [ ] Write `tests/prototype-smoke.spec.mjs`
- [ ] Update `package.json`
- [ ] Update `.github/workflows/ci.yml`
- [ ] Update `docs_comet/project/frontend/frontend-docs.md`
- [ ] Run `pnpm install` (adds @playwright/test)
- [ ] `pnpm exec playwright install --with-deps chromium`
- [ ] Verify intentional-failure: arity trap
- [ ] Verify intentional-failure: syntax error
- [x] `pnpm run ci` green on clean HEAD
- [x] `pnpm exec playwright test` green on clean HEAD
- [x] Patch `check:js` scope edge-cases from Codex review (`P1` concise-arrow scope body, `P2` hoisted `var` in nested blocks)
- [x] Patch `check:js` parameter-binding edge-case from Codex review (`.forEach(paramFn)` with default function expression)
- [x] Refine arity rule to ignore first-parameter defaults; switch smoke tests to `pathToFileURL(...)` for safe `file://` navigation
- [ ] `git push` + open PR
