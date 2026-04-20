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
- [ ] `pnpm run ci` green on clean HEAD
- [ ] `pnpm exec playwright test` green on clean HEAD
- [ ] `git push` + open PR
