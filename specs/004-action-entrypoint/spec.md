# Feature 004 — Action entrypoint: action.yml + ncc bundle + orphan push

## Goal

Ship the installable GitHub Action: `action.yml` metadata + `src/action.ts` entrypoint + `@vercel/ncc` single-file bundle + orphan force-push to a dedicated output branch containing the rendered SVG files. After this PR, any external user can reference `kiaquila/comet-contribution-graph@<sha>` in a workflow, point it at their own username, and have their comet graph regenerate at `raw.githubusercontent.com/<user>/<repo>/comet-graph/comet.svg`.

## Why

PR 002 delivered the pure-TS renderer; PR 003 delivered the GraphQL fetcher + parser. Both are library-shaped and do nothing on their own. PR 004 is the glue: inputs → `fetchContributions` → `renderCometSVG(animated=true)` → `renderCometSVG(animated=false)` (optional) → write files → orphan commit + force-push. Splitting this off from PR 005 (dogfood workflow + README embed) keeps each PR inside Codex's review comfort zone (historical budget: 3–6 cycles for L, cleaner for M), and keeps the Action publishable in isolation — a third-party user can install it without us having to own their README layout.

## Scope

**In scope** (third of four PRs toward MVP Action)

- `action.yml` — Action metadata at repo root. `name`, `description`, `author`, `branding`, and four inputs (see table below). `runs: using: node20, main: dist-action/index.js`.
- `src/action.ts` — entry that:
  1. Reads inputs via `@actions/core.getInput` (`username`, `token`, `reduced`, `branch`).
  2. Calls `fetchContributions(username, token)` from `src/data.ts`.
  3. Renders `comet.svg` via `renderCometSVG(days, { theme: DARK_THEME, animated: true })`.
  4. If `reduced === 'true'`, also renders `comet-reduced.svg` via `renderCometSVG(days, { theme: DARK_THEME, animated: false })`.
  5. Stages the SVG file(s) in a throwaway workdir, performs `git checkout --orphan <branch>`, `git add`, `git commit`, `git push --force origin HEAD:<branch>` via `@actions/exec`.
  6. On failure: `core.setFailed(err.message)`; no re-throw.
- `dist-action/index.js` — committed ncc bundle (Node 20 single file; expected size ≈ 100–500 KB minified). Bundled from `src/action.ts` by `@vercel/ncc`.
- `.gitattributes` at repo root — `dist-action/** linguist-generated=true` and `-diff` so GitHub auto-collapses the bundle in PR diff view and excludes it from language-stats.
- `package.json`:
  - Runtime deps: `@actions/core`, `@actions/exec`.
  - Dev dep: `@vercel/ncc`.
  - Scripts: `build:action` (`ncc build src/action.ts -o dist-action --minify --license licenses.txt`), `check:dist` (`pnpm run build:action && git diff --exit-code dist-action`).
  - Extend `ci` to include `check:ts` (already there), `build:action`, `check:dist`.
- `scripts/run-action.mjs` — local smoke runner. Mirrors `scripts/fetch-contributions.mjs` pattern: reads `GITHUB_TOKEN` + username from env/argv, calls the same orchestration flow as `src/action.ts`, writes SVGs to `sample-out/`, and **prints** the git command sequence it would run in the real Action without executing the push. Lets the author eyeball real-data SVG quality before pushing the PR.
- `tests/action.test.mjs` — unit suite:
  - Orchestration: given mocked `fetchContributions` and mocked exec, assert that `comet.svg` is produced, `comet-reduced.svg` is produced when `reduced: true` and omitted when `reduced: false`, and the git command sequence is `checkout --orphan <branch>`, `add <files>`, `commit -m <msg>`, `push --force origin HEAD:<branch>`.
  - Input parsing: `reduced` as `'true' | 'false' | ''` (default `'true'`), `branch` default `'comet-graph'`, missing `username` → `core.setFailed`.
  - Error paths: fetch throws → `core.setFailed` with message; exec throws → `core.setFailed` with git phase included in message.
- `scripts/check-static-baseline.mjs` — add `action.yml`, `.gitattributes`, `dist-action/index.js` to the required-files list (so `check:repo` enforces their presence going forward).
- `docs_comet/project/devops/github-action-target.md` — update `dist/` → `dist-action/` in the roadmap table + architecture section (documentation-moves-with-behavior per constitution rule 7); mark PR 004 row as landed.

**Out of scope** (deferred)

- Dogfood workflow (`.github/workflows/comet-graph.yml`) — PR 005.
- README overhaul with `<img>` embed and `<picture>` reduced-motion fallback — PR 005.
- Marketplace listing, Action versioning tag (`v1`) — post-MVP per target doc.
- `top_n`, `seed`, animation-timing inputs — post-MVP.
- Cross-user token / PAT input beyond the built-in `${{ github.token }}` default — post-MVP.
- `act` / Docker-based integration test — MVP relies on unit tests at the orchestration boundary plus the local smoke runner.
- GIF fallback — post-MVP (requires Puppeteer).
- Commit-signing / GPG on the orphan push — post-MVP; default push uses the Action's built-in identity.

## Constraints

- **Node 20 runtime.** `runs.using: node20` in `action.yml`. No Docker image, no Python, no shell interpreter beyond what `@actions/exec` invokes.
- **No additional HTTP clients.** `fetchContributions` already uses native `fetch`. No Octokit, no `@actions/github`.
- **Bundle must be self-contained.** `dist-action/index.js` is ES-module-compatible, single file. `ncc` inlines all imports — the runtime must not `require` anything from `node_modules/` beyond Node stdlib.
- **Pure renderer stays pure.** `src/renderer.ts`, `src/normalize.ts`, `src/themes.ts`, `src/prng.ts`, `src/data.ts`, `src/types.ts` are unchanged. No DOM, no browser API, no module-scope side effects creep in.
- **Prototype (`prototypes/variant-d-grid-peaks.html`) byte-identical.** Vercel preview is a no-op for this PR.
- **Token hygiene.** The `token` input is never logged, printed, echoed into exec argv, or written to the output branch. Git push uses `x-access-token:<token>@github.com` URL rewriting (the standard GitHub Actions pattern), never an `Authorization` header that could leak in `set -x` style.
- **`dist-action/` diff discipline.** The bundle on disk must match what `pnpm run build:action` produces from source. CI gate `check:dist` enforces this: if source and bundle diverge on a PR, the gate fails with a clear message telling the author to rerun `pnpm run build:action`.
- **CI green** end-to-end: `check:repo`, `check:html`, `check:js`, `check:ts`, `build`, `build:action`, `check:dist`, `format:check`, `test`.
- **Error budget for cold start.** Action runs in <60 seconds on empty-year user (no peaks, pure stars); <90 seconds on a heavy-user year. Install + first fetch + bundle load is the dominant cost; set a test timeout accordingly but don't hardcode exact ms thresholds — the CI machine is variable.

## Validation

- **Unit tests**: `pnpm test` runs `tests/action.test.mjs` alongside existing suites; all green. ≥ 8 new cases covering input parsing, reduced-variant toggle, git sequence, and error paths.
- **Bundle determinism**: `pnpm run build:action` twice in a clean checkout produces byte-identical `dist-action/index.js`.
- **CI "dist up-to-date" gate**: `pnpm run check:dist` passes on PR head; would fail if bundle were out of sync.
- **Type check**: `pnpm run check:ts` green.
- **Format**: `pnpm run format:check` green (new files added to the prettier glob).
- **Manual live smoke**: `GITHUB_TOKEN=<pat> node scripts/run-action.mjs kiaquila` writes `sample-out/comet.svg` and `sample-out/comet-reduced.svg`, prints a git-plan block without executing push. Human eyeballs the generated SVGs in a browser.
- **End-to-end dry run**: in a throwaway personal fork, run the built Action against a dummy repo on a temporary branch. Not a required gate for this PR (that's PR 005's dogfood workflow), but worth doing once to verify the orphan push actually populates a `comet-graph` branch.
- **No renderer/data regression**: `git diff origin/main -- src/renderer.ts src/normalize.ts src/themes.ts src/prng.ts src/data.ts src/types.ts` is empty.
- **CI gates**: `baseline-checks`, `guard`, `AI Review` green on PR head SHA; Vercel preview is a no-op (prototype unchanged).

## Acceptance

- `action.yml` at repo root, valid YAML, four inputs documented, `runs.using: node20`, `runs.main: dist-action/index.js`.
- `dist-action/index.js` committed; `.gitattributes` marks it `linguist-generated`.
- `pnpm test` runs ≥ 8 new test cases; all pass.
- `scripts/run-action.mjs --help` (or missing-arg branch) exits non-zero with a single-line usage message; with valid args, writes SVGs and prints git plan without pushing.
- `pnpm run ci` green end-to-end locally.
- `pnpm run check:feature-memory` green (spec folder complete).
- PR diff touches only: `specs/004-action-entrypoint/**`, `src/action.ts`, `action.yml`, `.gitattributes`, `dist-action/**`, `scripts/run-action.mjs`, `scripts/check-static-baseline.mjs`, `tests/action.test.mjs`, `package.json`, `pnpm-lock.yaml`, `docs_comet/project/devops/github-action-target.md`.

## Action inputs (final, subject to user approval)

| Input      | Required | Default               | Description                                                                                            |
| ---------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `username` | yes      | —                     | GitHub login to render the graph for                                                                   |
| `token`    | no       | `${{ github.token }}` | Token used for GraphQL `contributionsCollection` query. PAT with `read:user` needed for cross-user     |
| `reduced`  | no       | `'true'`              | Whether to also emit `comet-reduced.svg` (a static/no-SMIL variant) alongside the animated `comet.svg` |
| `branch`   | no       | `'comet-graph'`       | Output branch. Force-pushed on every run. Must be different from any branch the user cares about       |

Matches the shape in `docs_comet/project/devops/github-action-target.md` "Action inputs" section verbatim. No `top_n`, `seed`, theme, or timing inputs — deferred per fixed-decisions table.

## Fixed design decisions (user-approved 2026-04-21)

| Decision                   | Value                                                                                                                                   | Source / rationale                                                                                                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundler                    | `@vercel/ncc`                                                                                                                           | target doc; ecosystem standard for JS Actions (Platane/snk, actions/checkout)                                                                                                                                                               |
| Bundle entry               | `src/action.ts` (TS source; ncc has built-in TS)                                                                                        | avoids a second tsc prebuild step; `build:action` is one tool                                                                                                                                                                               |
| Bundle output path         | `dist-action/index.js`                                                                                                                  | **deviation from target doc** — `dist/` is already occupied by `build-static.mjs` → Vercel preview. Separate dir keeps Vercel untouched. `dist-action` is parallel to existing `dist-renderer/` (tsc output). Target doc updated in this PR |
| `dist-action/` in git      | **committed** + `.gitattributes linguist-generated=true` + `-diff`                                                                      | Actions ecosystem convention; GitHub collapses the bundle in PR diff view and excludes from lang-stats                                                                                                                                      |
| `dist-action/` in lockfile | not in `.gitignore` (explicitly committed)                                                                                              | opposite of `dist/` and `dist-renderer/`, both of which stay gitignored                                                                                                                                                                     |
| `dist/` (Vercel)           | untouched — stays gitignored, regenerated by `pnpm build`                                                                               | no Vercel-side changes in this PR, zero blast radius on prototype deploy                                                                                                                                                                    |
| Runtime deps               | `@actions/core`, `@actions/exec`                                                                                                        | minimal — no `@actions/github` (no Octokit usage), no `@actions/io` (Node fs is enough)                                                                                                                                                     |
| Dev deps                   | `@vercel/ncc`                                                                                                                           | used only at `pnpm run build:action`                                                                                                                                                                                                        |
| Reduced variant generation | second call to `renderCometSVG(days, { theme: DARK_THEME, animated: false })`                                                           | renderer already supports `animated: false` (see `src/renderer.ts:482` — the `animated` flag strips `<animate*>` elements); no new renderer code                                                                                            |
| Seed value                 | `undefined` (renderer default `0x5eed`)                                                                                                 | deterministic starfield across all users in MVP; per-user hashing deferred until users ask                                                                                                                                                  |
| Theme                      | hardcoded `DARK_THEME`                                                                                                                  | target doc "dark-only" fixed decision                                                                                                                                                                                                       |
| Push mechanism             | inside action.ts via `@actions/exec` — `git checkout --orphan`, `add`, `commit`, `push --force`                                         | Platane/snk pattern; users install a single Action, no extra workflow YAML to write                                                                                                                                                         |
| Push auth                  | URL-embedded `x-access-token:<token>@github.com/<owner>/<repo>.git`                                                                     | standard Actions idiom; the token never enters `Authorization` header, never echoed via `set -x`                                                                                                                                            |
| Error propagation          | `core.setFailed(err.message)` — no re-throw, no process.exit                                                                            | Actions convention; `setFailed` flips job state without disturbing logs                                                                                                                                                                     |
| Testing strategy           | unit tests at orchestration boundary; stub `globalThis.fetch` (re-uses 003 pattern) + stub `@actions/exec.exec` via module monkey-patch | CLAUDE.md "no abstractions for single-use"; no `act`/Docker integration test in MVP                                                                                                                                                         |
| Local smoke runner         | `scripts/run-action.mjs` — executes full flow, skips `git push` step, prints the planned command sequence                               | mirrors `scripts/fetch-contributions.mjs`; safe to run on author's machine without mutating any remote                                                                                                                                      |
| CI "dist up-to-date" gate  | new `check:dist` script: `pnpm run build:action && git diff --exit-code dist-action`                                                    | prevents stale bundle; standard pattern in Actions ecosystem; runs in `ci` after `build:action`                                                                                                                                             |
| Commit strategy            | single commit on this worktree, spec + code together                                                                                    | matches PR 003 commit discipline (user-approved 2026-04-21)                                                                                                                                                                                 |
| Commit subject             | `feat(action): ncc-bundled entrypoint + orphan push`                                                                                    | ≤ 72 chars, conventional prefix per CLAUDE.md                                                                                                                                                                                               |

## Non-goals

- **No GitHub App flow.** The Action works with a simple PAT (or the built-in `${{ github.token }}`); App installation tokens are not special-cased.
- **No cache.** Every run re-fetches contributions from GraphQL. Weekly cron cadence (PR 005) keeps API usage well below the authenticated 5000 req/hr limit.
- **No retries / circuit breakers / timeouts.** One shot, fail fast, surface the error via `setFailed`. Users re-run the workflow on transient failure.
- **No Windows/macOS runner support.** Action runs on `ubuntu-latest` (implicit via `runs.using: node20` which is cross-platform, but we test only Linux).
- **No multi-user batch mode.** One invocation renders one user's graph. Multi-user support would require a workflow-level matrix strategy — out of scope for the Action itself.
- **No `main:` other than ncc bundle.** We do not ship an alternate `node_modules`-based entry for dev loop; local smoke uses `scripts/run-action.mjs` against TS source via tsc.
