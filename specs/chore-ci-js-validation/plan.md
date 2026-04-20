# Plan: chore/ci-prototype-js-validation

## Steps

### 1 — Write `scripts/check-prototype-js.mjs`

- Glob `prototypes/**/*.html`
- Extract all `<script>` blocks (skip non-JS types)
- **Step 1 (syntax):** `new vm.Script(code)` — SyntaxError → `exit(1)` with
  file + block number + first line of error message
- **Step 2 (arity):** regex scan for `.forEach(identifier)` patterns; look up
  the function definition of `identifier`; if it has ≥2 params and at least one
  default (`=`) → `exit(1)` with explanation and fix hint

Verify condition: `node scripts/check-prototype-js.mjs` exits 0 on clean HEAD

### 2 — Write `tests/prototype-smoke.spec.mjs` + `playwright.config.mjs`

- `playwright.config.mjs` at repo root: Chromium only, `testMatch: **/*.spec.mjs`
- `tests/prototype-smoke.spec.mjs`: iterate `prototypes/**/*.html`, open each
  via `file://` URL, wait 2 s, assert zero `pageerror` events

Verify condition: `pnpm exec playwright test` exits 0 on clean HEAD

### 3 — Update `package.json`

- Add `"check:js": "node scripts/check-prototype-js.mjs"`
- Add `"check:js:smoke": "playwright test"`
- Update `"ci"` to: `check:repo && check:html && check:js && build && format:check && test`
- Add `"playwright.config.mjs"` to `format:check` glob
- Add `@playwright/test ^1.49.0` to devDependencies

Verify condition: `pnpm run ci` exits 0

### 4 — Update `.github/workflows/ci.yml`

- Add `js-smoke` job with `needs: baseline-checks`
- Cache `~/.cache/ms-playwright` keyed on OS + Playwright version
- Run `playwright install --with-deps chromium`
- Run `pnpm run check:js:smoke`

Verify condition: workflow YAML is valid; `js-smoke` appears as a separate
required check on the PR

### 5 — Update `docs_comet/project/frontend/frontend-docs.md`

- Add "CI Validation" section documenting `check:js` and `js-smoke` steps,
  what each catches, and the intentional-failure verification procedure

Verify condition: section present and accurate

### 6 — Verify intentional-failure cases

1. Insert `array.forEach(renderFn)` where `renderFn(v, x = 0)` → `check:js` fails
2. Insert `const x = 1 +` (syntax error) in a `<script>` block → `check:js` fails
3. Revert both → `pnpm run ci` green
4. `pnpm exec playwright test` green on clean HEAD
