# Plan — chore-ci-eslint

## Steps

1. Add ESLint devDependencies to `package.json`
   → verify: `pnpm install` succeeds

2. Create `eslint.config.mjs` with browser/HTML inline script config
   → verify: `eslint --print-config prototypes/variant-d-grid-peaks.html` shows correct rules

3. Add `check:js` script to `package.json`; include after `check:html` in `ci` script
   → verify: `pnpm run check:js` exits 0 on existing HTML

4. Update `docs_comet/project/frontend/frontend-docs.md` with JS validation section
   → verify: Guard docs-coverage step passes

5. Create `specs/chore-ci-eslint/` feature memory (this folder)
   → verify: feature-memory gate passes

6. Run full `pnpm run ci`
   → verify: all 6 steps green
