# Spec: chore/ci-prototype-js-validation

## Problem

Two consecutive PRs shipped JS bugs in `<script>` blocks of prototype HTML files
through a green CI. The existing pipeline (`html-validate`, `prettier`) checks
markup structure and formatting but does not execute or statically analyse inline
JavaScript. Both bugs only surfaced at Vercel preview runtime.

- **Incident 1** — syntax error (missing `=>`): caught class: `SyntaxError` in V8
- **Incident 2** — arity trap (`.forEach(fn)` where `fn` has default params): silent
  runtime failure because `forEach` passes `(element, index, array)`, overwriting
  the default value with `index`

## Goal

Add a `check:js` step to the existing `ci` script that catches both incident
classes statically, plus a headless Playwright smoke test in a separate CI job
that catches uncaught runtime exceptions.

## Scope

- `scripts/check-prototype-js.mjs` — new validator (syntax + arity)
- `tests/prototype-smoke.spec.mjs` — Playwright smoke test
- `playwright.config.mjs` — Playwright configuration (Chromium only)
- `package.json` — add `check:js`, `check:js:smoke`; wire `check:js` into `ci`
- `.github/workflows/ci.yml` — add `js-smoke` job with browser cache
- `docs_comet/project/frontend/frontend-docs.md` — document CI validation layer

## Non-goals

- Full ESLint integration (over-engineered for two specific failure classes)
- Coverage of external `.js` files (none exist yet in prototypes)
- Jest / mocha (project uses `node --test`; Playwright has its own runner)
