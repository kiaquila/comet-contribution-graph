# Feature chore-ci-eslint — Replace custom JS checker with ESLint

## Goal

Replace the bespoke `vm.Script`/`acorn`-based JS validator (PR #3) with
ESLint v9 + `eslint-plugin-html`, eliminating custom maintenance burden while
keeping the same error classes detected.

## Why

PR #3 accumulated 6 Codex review cycles on the custom checker. Each fix
introduced a new edge case (regex parsing, string-context tracking, lexical
scope). ESLint community rules cover the same problem classes and are
maintained by the ecosystem rather than in-repo custom code.

## Scope

**In scope**

- `eslint.config.mjs` — ESLint v9 flat config for HTML prototype files
- `package.json` — add ESLint devDependencies; add `check:js` script; include in `ci`
- `docs_comet/project/frontend/frontend-docs.md` — document the validation pipeline

**Out of scope**

- Playwright smoke tests (from PR #3) — separate concern, not ported here
- Migrating to `@eslint/html` (ESLint v9 official HTML plugin) — future when flat-config migration is complete

## Acceptance criteria

- `pnpm run check:js` passes clean on existing prototype HTML files (no false positives)
- `pnpm run ci` fully green
- ESLint catches: forEach arity trap, unsafe `new RegExp(str)`, syntax errors, `import` in non-module script
