# Plan — Renderer extraction

## Approach

Three-phase implementation on this worktree. Phase A stands up the TS toolchain without any rendering logic — a minimal "hello world" `src/renderer.ts` that compiles, lints, and tests green, to isolate toolchain risk from port risk. Phase B ports `renderSky()` byte-for-byte into pure TS, preserving the prototype's visual output by reusing the same PRNG seed and layout math; CSS/JS animations are replaced with SMIL equivalents using the fixed timing table from the spec. Phase C adds fixtures, snapshots, normalization tests, and the sample-render CLI.

Prototype is not touched. Extracted logic is a fresh, independent module — we copy constants from the prototype's `renderSky()` (`prototypes/variant-d-grid-peaks.html:416-690`) into `src/renderer.ts` and iterate on TS until snapshot parity is acceptable. A second consumer will be the Action entrypoint (PR 004); until then the only caller is the test suite + sample script.

## Why not /plan or /ralph

- `/plan` interview is overkill — the design decisions are fixed (see spec table).
- `/ralph` loop is inappropriate — each phase has manual visual verification that requires human eyes; no machine-checkable "done" until snapshots are accepted.
- Manual executor + code-reviewer cycle is the right shape: fast feedback, clear gates.

## Phase breakdown

### Phase A — TS toolchain (smallest possible diff)

1. `pnpm add -D typescript @types/node` — adds deps, updates lockfile.
2. `tsconfig.json` — strict mode, `target: ES2022`, `module: NodeNext`, `outDir: dist-renderer`, `rootDir: src`, `declaration: true`.
3. `src/renderer.ts` with a stub `renderCometSVG(data: ContributionDay[]): string` returning `<svg></svg>`.
4. `src/types.ts` — shared types (minimal shape, expanded in Phase B).
5. Update `package.json` scripts: add `build:renderer`, extend `ci` to include `tsc --noEmit`.
6. Extend ESLint flat config (`eslint.config.*`) to lint `src/**/*.ts` using `@typescript-eslint/parser` **only if zero-friction**; if `@typescript-eslint` adds complexity, defer to tsc-only type checking and keep ESLint HTML-only for PR 002. Flag as open question below.
7. One smoke test `tests/renderer.smoke.test.mjs` — imports the compiled renderer (or via tsx runtime), asserts it returns a string starting with `<svg`.

**Phase A gate**: `pnpm run ci` green. Zero product code changed. Snapshot lock-in point before porting.

### Phase B — port `renderSky()` into pure TS

1. Copy the PRNG (`makePRNG`, prototype lines 321-329) into `src/prng.ts`. Unit test: same seed → same sequence for N iterations.
2. Port helper functions (`lerp`, star classifiers, color/radius mappers — prototype lines 342-369) into `src/renderer.ts` as private functions.
3. Port grid geometry + star placement — pure SVG string concatenation; use a small `svg()` tag helper (`el('circle', { cx, cy, r, fill })`) to keep the builder readable without introducing a framework.
4. Percentile normalization in `src/normalize.ts`: compute P50/P75/P90/P95/P99 from non-zero counts, return `StarBucket` per day. Peak selection: sort by count desc, take top 7 (clamp [2,7]), break ties by date order for determinism. Empty-year path: returns `{ peaks: [], buckets: [...zeros] }`.
5. SMIL animation emission:
   - Background stars: `<animate attributeName="opacity" values="0.08;0.3;0.08" dur="7s" repeatCount="indefinite" begin="-{staggerPerStar}s" />`.
   - Peak halos: `<animate attributeName="fill-opacity" values="0.25;0.45;0.25" dur="3s" repeatCount="indefinite" begin="-{peakIdx*0.6}s" />`.
   - Comet head: `<circle r="{headR}" fill="..."><animateMotion dur="4.8s" repeatCount="indefinite" keyTimes="0;0.585;1" keyPoints="0;1;1" path="M... L..." /></circle>` — the `keyTimes/keyPoints` encodes traversal (0–2.8s) + hold (2.8s–4.8s = 2.0s → close to 3.5s target; adjust `keyTimes` to hit 4.8s active + 3.5s hold = 8.3s total: set `dur="8.3s"` with `keyTimes="0;0.578;1"` where comet reaches end at t=4.8s and stays until t=8.3s).
6. `animated: false` branch: skip all `<animate>` / `<animateMotion>` emission; render constellation path as a static line, hide the comet head element. This is the reduced-motion fallback.
7. Theme support: `src/themes.ts` exports `DARK_THEME` and `LIGHT_THEME`; renderer takes `theme: Theme` and uses it for background, star, halo, comet, label colors.

**Phase B gate**: `pnpm test` green, sample render for `normal-user` fixture visually similar to prototype variant-d defaults (reviewer eyeballs it).

### Phase C — tests, fixtures, tooling

1. Five fixture files under `tests/fixtures/`:
   - `empty-year.json` — all zeros.
   - `sparse-user.json` — ~20 non-zero days scattered.
   - `normal-user.json` — mirrors prototype's variant-d default profile.
   - `heavy-user.json` — 300+ active days, mimics prolific committer.
   - `single-day.json` — exactly one non-zero day (edge case for clamp [2,7]).
2. Snapshot tests: render each fixture in `animated × theme` combos (8 snapshots: 4 fixtures × 2 themes; `empty-year` covered separately). Snapshots under `tests/__snapshots__/renderer/`.
3. Normalize unit tests: percentile math on all five fixtures, edge cases (all-zero, single non-zero).
4. Determinism test: `renderCometSVG(data, opts)` called twice → identical strings.
5. `scripts/render-sample.mjs <fixture>` — loads fixture, calls renderer in both theme modes and both animated modes, writes to `sample-out/<fixture>-{theme}-{anim}.svg`. Add to `.gitignore` but not to the committed tree.

**Phase C gate**: full `pnpm run ci` green locally; manual browser check on at least one sample SVG confirms SMIL plays and reduced variant is static.

## Validation order

1. Phase A → commit → `pnpm run ci` local.
2. Phase B → commit → `pnpm test` + manual sample render.
3. Phase C → commit → full `pnpm run ci` + `pnpm run check:feature-memory`.
4. Code-reviewer subagent pass on `src/**` and tests — focus on purity, determinism, SMIL correctness, type strictness.
5. `git push` → PR open → `@codex review` via gh CLI.
6. Wait for `baseline-checks`, `guard`, `AI Review`, Vercel preview (prototype unchanged, so Vercel should be a no-op green).
7. Iterate on the same branch until all checks green + no blocking Codex findings.

## Risks

- **SMIL timing mismatch**: the 4.8s + 3.5s (8.3s total) cycle requires `keyTimes`/`keyPoints` math. If visual result feels off, adjust with concrete values and update the spec's fixed table.
- **Snapshot fragility**: any change in PRNG, layout math, or SMIL attribute order re-churns snapshots. Mitigation: canonical attribute order in the `el()` helper, stable iteration order over data.
- **Type import for `.ts` from `.mjs` tests**: Node 20 test runner doesn't natively load TS. Options: (a) compile `src/` to `dist-renderer/` in a pre-test hook, tests import from `dist-renderer`; (b) run tests via `tsx` or `--experimental-strip-types`. Prefer (a) — matches PR 004's ncc packaging flow and avoids runtime-loader risk. Pre-test build adds ~0.5s to `pnpm test`; acceptable.
- **ESLint for TS**: adding `@typescript-eslint` expands the dev-deps set and can conflict with current `eslint-plugin-unicorn` config. If integration is >30 min of work, defer ESLint-for-TS to a later chore PR and rely on `tsc --noEmit` strict mode in `ci`. Not a blocker for PR 002 merge.
- **Prototype drift**: someone could push prototype edits in parallel. Pre-push hook + merge-conflict policy catches this; rebase onto main before final push.
- **Codex review cycle count**: this PR is L with ~500 LOC new + tests. Budget 3–5 cycles, similar to PR #2.

## Out of bounds

- No `action.yml`, no ncc bundle, no GraphQL — strictly PR 003 and PR 004.
- No changes to CI workflow YAML beyond adding TypeScript compile to `pnpm run ci` (which runs inside the existing `baseline-checks` job).
- No new docs under `docs_comet/` in this PR. Doc updates for the Action architecture land with PR 004.
- No changes to `prototypes/`.
