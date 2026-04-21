# Tasks — Renderer extraction

## Phase A: TS toolchain

- [ ] Add `typescript` and `@types/node` to `devDependencies` via `pnpm add -D`
- [ ] Create `tsconfig.json` with strict mode, `target: ES2022`, `module: NodeNext`, `outDir: dist-renderer`, `rootDir: src`, `declaration: true`
- [ ] Create `src/types.ts` with `ContributionDay`, `RenderOptions`, `Theme`, `StarBucket` (minimal shapes)
- [ ] Create `src/renderer.ts` stub that returns `<svg xmlns="http://www.w3.org/2000/svg"></svg>`
- [ ] Add `build:renderer` script in `package.json` (runs `tsc`)
- [ ] Extend `ci` script to run `tsc --noEmit` before other checks
- [ ] Decide ESLint-for-TS — integrate if ≤30 min work, otherwise defer (document decision in PR description)
- [ ] Create `tests/renderer.smoke.test.mjs` — imports compiled renderer, asserts it returns `<svg...`
- [ ] Update `.gitignore` to exclude `dist-renderer/` and `sample-out/`
- [ ] Verify `pnpm run ci` green locally

## Phase B: port rendering logic

- [ ] Create `src/prng.ts` — port `makePRNG` from prototype (`variant-d-grid-peaks.html:321-329`); unit test for determinism
- [ ] Create `src/normalize.ts` — percentile bucketing (P50/P75/P90/P95/P99) + top-K peak selection with clamp [2,7]
- [ ] Create `src/themes.ts` — `DARK_THEME`, `LIGHT_THEME` palette objects
- [ ] Port star helpers (`lerp`, `nonPeakR`, `nonPeakFill`, `peakFill`) into `src/renderer.ts` as private functions
- [ ] Port grid geometry + star placement into `renderer.ts`; use a small `el(tag, attrs, children)` string builder with stable attribute order
- [ ] Emit SMIL animations: twinkle (7s), halo-pulse (3s stagger 0.6s/peak), comet `<animateMotion>` with 8.3s cycle (4.8s active + 3.5s hold via `keyTimes`/`keyPoints`)
- [ ] Branch for `animated: false` — skip all `<animate>` / `<animateMotion>`; render static constellation path; hide comet head
- [ ] Handle empty-year path — render stars-only sky, no comet, no constellation path, no `<animateMotion>`
- [ ] Verify font is system `monospace` everywhere (no CDN link, no `@font-face`)

## Phase C: tests, fixtures, sample tool

- [ ] Create `tests/fixtures/empty-year.json`
- [ ] Create `tests/fixtures/sparse-user.json` (~20 non-zero days)
- [ ] Create `tests/fixtures/normal-user.json` (mirrors prototype variant-d profile)
- [ ] Create `tests/fixtures/heavy-user.json` (300+ active days)
- [ ] Create `tests/fixtures/single-day.json` (1 non-zero day)
- [ ] Create `tests/renderer.test.mjs` — snapshot tests for 4 fixtures × 2 themes + empty-year + single-day reduced-motion variant
- [ ] Create `tests/normalize.test.mjs` — percentile correctness + clamp [2,7] on all fixtures
- [ ] Add determinism assertion: `renderCometSVG(data, opts)` twice → identical strings
- [ ] Create `scripts/render-sample.mjs <fixture>` — writes SVG files to `sample-out/<fixture>-{theme}-{anim}.svg`
- [ ] Manual browser check: open one sample SVG from `sample-out/`, confirm comet streaks + reduced variant is static

## Verification

- [ ] `pnpm run ci` green (including new `tsc --noEmit` step)
- [ ] `pnpm test` includes ≥ 10 new test cases, all pass
- [ ] `git diff origin/main -- prototypes/` empty (prototype byte-identical)
- [ ] `pnpm run check:feature-memory` green (this folder complete)
- [ ] `code-reviewer` subagent pass on `src/**` + tests — focus: purity, determinism, SMIL correctness, strict typing
- [ ] Commit on worktree branch `claude/laughing-curran-fe6403`
- [ ] Pre-push hook passes
- [ ] PR opened against `main`
- [ ] `@codex review` posted via gh CLI after first push and after every subsequent push
- [ ] `baseline-checks`, `guard`, `AI Review` checks all green on PR head SHA
- [ ] Vercel preview green (prototype unchanged, expect no-op)
- [ ] All blocking Codex findings resolved

## Out of scope (deferred to later PRs)

- [ ] GraphQL data layer — PR 003 (`specs/003-data-layer/`)
- [ ] `action.yml` + ncc bundle + output-branch push — PR 004 (`specs/004-action-entrypoint/`)
- [ ] Dogfood workflow + README embed — PR 005 (`specs/005-dogfood/`)
- [ ] GIF output — post-MVP
- [ ] Playground / landing — post-MVP
- [ ] Marketplace listing — post-MVP
