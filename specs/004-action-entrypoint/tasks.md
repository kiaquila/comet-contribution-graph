# Tasks — Action entrypoint

## Dependencies + scripts

- [x] Add runtime deps to `package.json`: `@actions/core ^1.11`, `@actions/exec ^1.1`
- [x] Add dev dep: `@vercel/ncc ^0.38`
- [x] Run bare `pnpm install` once to update `pnpm-lock.yaml` (frozen-lockfile fails until lockfile regen — see memory `feedback_pnpm_new_dep_flow`)
- [x] Commit the updated `pnpm-lock.yaml`
- [x] Add script `build:action`: `ncc build src/action.ts -o dist-action --minify --license licenses.txt`
- [x] Add script `check:dist`: `pnpm run build:action && git diff --exit-code dist-action`
- [x] Extend `ci` script chain to include `pnpm run build:action && pnpm run check:dist` between `build` and `format:check`
- [x] Extend `format:check` glob to include `action.yml`, `specs/004-action-entrypoint/**/*.md`, `scripts/run-action.mjs` (already picked up by `scripts/**/*.mjs`)

## `src/action.ts`

- [x] Create `src/action.ts` exporting `run(): Promise<void>`
- [x] Read inputs via `@actions/core.getInput`: `username` (required), `token` (fallback to `process.env.GITHUB_TOKEN`), `reduced` (default `'true'`, compare `!== 'false'`), `branch` (default `'comet-graph'`)
- [x] Validate `username` against `/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/`; reject with `setFailed` + reason on mismatch
- [x] Validate `branch` against `/^[A-Za-z0-9._/-]{1,100}$/`; reject with `setFailed` + reason on mismatch
- [x] Read `process.env.GITHUB_REPOSITORY`; reject with `setFailed` if missing
- [x] Call `core.setSecret(token)` before any exec or logging paths
- [x] Call `fetchContributions(username, token)` from `./data.js`
- [x] Render animated SVG: `renderCometSVG(days, { theme: DARK_THEME, animated: true })`
- [x] `mkdtemp` a workdir under `os.tmpdir()`, write `comet.svg`
- [x] If `reduced` truthy: render reduced SVG `renderCometSVG(days, { theme: DARK_THEME, animated: false })`, write `comet-reduced.svg`
- [x] Implement `pushOrphan({ workdir, branch, token, files })` using `@actions/exec.exec`:
  - [x] `git init --quiet`
  - [x] `git config user.name comet-graph-bot`
  - [x] `git config user.email comet-graph-bot@users.noreply.github.com`
  - [x] `git checkout --orphan <branch>`
  - [x] `git add <files>`
  - [x] `git commit --quiet -m "chore: regenerate <files>"`
  - [x] `git push --force --quiet https://x-access-token:<token>@github.com/<owner>/<repo>.git HEAD:<branch>`
- [x] Respect `COMET_DRY_RUN=1` env var: inside `pushOrphan`, log planned command sequence and return without executing push (local smoke path)
- [x] Catch errors at top level: `core.setFailed(err instanceof Error ? err.message : String(err))`; do not re-throw, do not `process.exit`
- [x] Self-invoke `run()` at module bottom via `if (import.meta.url === \`file://${process.argv[1]}\`)` so the ncc-bundled entry actually runs

## `action.yml`

- [x] Create `action.yml` at repo root
- [x] Populate `name`, `description`, `author`, `branding` (`icon: star`, `color: purple`)
- [x] Declare inputs matching spec table: `username` (required), `token` (default `${{ github.token }}`), `reduced` (default `'true'`), `branch` (default `'comet-graph'`), each with a `description`
- [x] `runs.using: node20`, `runs.main: dist-action/index.js`
- [x] Verify YAML parses cleanly (no duplicate keys, 2-space indent, `description` on inputs not optional)

## `.gitattributes`

- [x] Create `.gitattributes` at repo root
- [x] Add `dist-action/** linguist-generated=true`
- [x] Add `dist-action/** -diff`
- [x] Verify: `git check-attr linguist-generated dist-action/index.js` returns `set`

## Initial ncc bundle

- [x] Run `pnpm run build:action` — produces `dist-action/index.js` + `dist-action/licenses.txt` (license file is ncc convention)
- [x] Inspect bundle size: expected 100–500 KB. Record actual size in PR description for visibility
- [x] Smoke-test bundle loads: `node dist-action/index.js` (will exit 1 with missing-username error — that proves the bundle parses and `run()` is reachable)
- [x] Commit both `dist-action/index.js` and `dist-action/licenses.txt`

## `scripts/run-action.mjs` (local smoke)

- [x] Create `scripts/run-action.mjs`
- [x] Argv parsing: first positional arg = username; `--help` or missing → single-line usage, exit 1
- [x] Read `GITHUB_TOKEN` from env (required); reject with 1-line error if missing
- [x] Populate env: `INPUT_USERNAME`, `INPUT_TOKEN`, `INPUT_REDUCED` (default `true`), `INPUT_BRANCH` (default `comet-graph`), `GITHUB_REPOSITORY` (default `local/smoke`), `COMET_DRY_RUN=1`
- [x] `spawnSync("pnpm", ["run", "build:renderer"])` to compile TS → `dist-renderer/`; propagate exit code
- [x] Dynamic-import `../dist-renderer/action.js`; call `run()`
- [x] After run, copy `comet.svg` (+ `comet-reduced.svg` if present) from tempdir to `sample-out/` — or adapt `run()` to respect `COMET_OUT_DIR` env var pointing at `sample-out/`
- [x] Single summary line: `wrote sample-out/comet.svg, sample-out/comet-reduced.svg (days=N active=M max=K)`

## Tests `tests/action.test.mjs`

- [x] Test: renders and writes only `comet.svg` when `INPUT_REDUCED=false`
- [x] Test: renders both `comet.svg` and `comet-reduced.svg` when `INPUT_REDUCED=true`
- [x] Test: `INPUT_REDUCED` omitted → defaults to `'true'` → both files produced
- [x] Test: missing `INPUT_USERNAME` → `core.setFailed` called with message mentioning `username`
- [x] Test: missing `INPUT_TOKEN` AND missing `GITHUB_TOKEN` env → `setFailed` called with message mentioning token
- [x] Test: `username` with invalid chars (e.g., `--flag`) → `setFailed` + validation message, no fetch issued
- [x] Test: `branch` with invalid chars → `setFailed`, no fetch issued
- [x] Test: stubbed `fetchContributions` throws → `setFailed` propagates the thrown message verbatim
- [x] Test: stubbed `exec` rejects on second git call → `setFailed` mentions which git phase failed (best-effort)
- [x] Test: git command sequence observed via exec stub matches `init → config.name → config.email → checkout --orphan → add → commit → push`
- [x] Test: push URL embeds `x-access-token:<token>@github.com/<owner>/<repo>.git`, not an `Authorization` header
- [x] Test: `core.setSecret` is called with the token before the first exec invocation
- [x] Test: `GITHUB_REPOSITORY` missing → `setFailed`, no push attempted
- [x] `afterEach` restores original `globalThis.fetch`, exec stub, env state (`INPUT_*`, `GITHUB_*`, `COMET_*`)

## Baseline gate extension

- [x] Open `scripts/check-static-baseline.mjs`
- [x] Append to `requiredFiles`: `"action.yml"`, `".gitattributes"`, `"dist-action/index.js"`
- [x] Verify: temporarily removing any of them → `pnpm run check:repo` exits 1 with a list of missing files

## Target doc sync

- [x] Open `docs_comet/project/devops/github-action-target.md`
- [x] Update "4-PR roadmap" row 004: replace bundle path `dist/` with `dist-action/`; note PR 004 as "in review"
- [x] Update "Status" section with PR 004 state
- [x] Update "Architecture contract → Deploy" section to reference `dist-action/` and mention orphan push is inside the Action itself
- [x] Update `.gitattributes` mention: `dist-action/** linguist-generated`
- [x] Re-run `pnpm run format:check`

## Verification

- [x] `pnpm run check:ts` green
- [x] `pnpm run build:action` green (ncc emits `dist-action/index.js`)
- [x] `pnpm run check:dist` green (bundle matches source)
- [x] `pnpm test` green (≥ 8 new cases passing under `tests/action.test.mjs`)
- [x] `pnpm run ci` green end-to-end locally
- [x] `pnpm run check:feature-memory` green
- [ ] Manual smoke: `GITHUB_TOKEN=<pat> node scripts/run-action.mjs kiaquila` writes `sample-out/comet.svg` + `sample-out/comet-reduced.svg`, prints git-plan block
- [ ] Eyeball smoke-output SVGs in a browser (open `sample-out/comet.svg` + `sample-out/comet-reduced.svg` as local files) — confirm no regressions vs PR 002 snapshot baselines
- [x] `git diff origin/main -- src/renderer.ts src/normalize.ts src/themes.ts src/prng.ts src/data.ts src/types.ts prototypes/` empty
- [x] `code-reviewer` subagent pass on `src/action.ts`, `tests/action.test.mjs`, `scripts/run-action.mjs` — focus: token leak, exec argv injection (username/branch must be validated before reaching exec), error surface, `COMET_DRY_RUN` gating, no side effects at module load (3 × P1 addressed: token URL moved below DRY_RUN gate, exec-rejection test added, dry-run coverage test added; 2 × P2 addressed: dead COMET_OUT_DIR logic removed, unused `@actions/exec` test import removed)

## PR + review cycles

- [ ] Single commit on branch: `feat(action): ncc-bundled entrypoint + orphan push`
- [ ] Pre-push hook passes (`check-feature-memory-on-push.sh`)
- [ ] `git push` → PR opened against `main`
- [ ] `@codex review` posted via `gh` CLI after every push (per memory `feedback_codex_human_trigger`)
- [ ] `baseline-checks`, `guard`, `AI Review` green on PR head SHA
- [ ] Vercel preview green (prototype unchanged)
- [ ] All blocking Codex findings (`P0`–`P2`) resolved

## Out of scope (deferred)

- [ ] `.github/workflows/comet-graph.yml` dogfood workflow — PR 005
- [ ] README overhaul with `<img>` + `<picture>` reduced-motion fallback — PR 005
- [ ] Marketplace listing + `v1` tag — post-MVP
- [ ] `top_n`, `seed`, theme, animation-timing inputs — post-MVP
- [ ] Cross-user PAT UX beyond the default `${{ github.token }}` — post-MVP
- [ ] `act` / Docker integration tests
- [ ] GIF fallback (requires Puppeteer)
- [ ] Commit-signing on orphan push
- [ ] Per-user seed derived from username hash
- [ ] Bundle size gate (add only on ~1 MB regression)
- [ ] Windows/macOS runner support (Linux-only MVP)
