# Plan — Dogfood (workflow + README publish)

## Approach

Single-phase, four-file change. No new code, no new deps, no new tests. The whole PR is:

1. One YAML workflow file.
2. One README rewrite (surgical edits on top, new sections appended, dev sections retained).
3. Two touches to existing files (target-doc sync + baseline-checker extension).
4. One spec folder (this doc + tasks).

The Action bundle, renderer, data layer, and entrypoint are frozen. This PR composes their already-shipped behavior into a live workflow and publishes a user-facing README — it does not alter how any of them behave.

## Why not `/ralph` or `/ultrawork`

- **`/ralph`**: no verification cycle worth looping — the single real validation (live workflow run) happens post-merge, outside the PR loop.
- **`/ultrawork`**: 5 edits, 3 of which depend on spec decisions first — parallel decomposition saves ≈30 seconds while adding context overhead.
- **Direct executor**: fixed decisions below eliminate all ambiguity; the task is mechanical edits + format + CI — right fit for a scoped executor + one code-reviewer pass before push.

## Open-question resolutions

The parent `/plan` request enumerated ten open questions. Resolutions, locked here so the executor does not reopen them:

1. **Cron cadence** → `0 3 * * 1` (Monday 03:00 UTC, weekly) + `workflow_dispatch:`. Target-doc says "weekly + dispatch"; Monday 03:00 UTC is a low-traffic window.
2. **Permissions scope** → Job-level `contents: write`. No other scopes needed.
3. **Dogfood target repo** → **Option C strategy locked (A now, B next thread).** This PR = Option A: source-repo (`kiaquila/comet-contribution-graph`) workflow + source-repo embed. Rationale: zero-secrets via default `${{ github.token }}`, gives weekly auto-regression via cron, validates pipeline. Next-thread PR 006 = Option B: profile-repo (`kiaquila/kiaquila`) workflow via `uses: kiaquila/comet-contribution-graph@main`, uses profile-repo's own `${{ github.token }}` (no PAT needed), embeds in profile README for marketing-facing shopfront deployment. Both options coexist — A catches regressions, B is public demo.
4. **README "Live demo" placement** → At the top (badges + image), Platane/snk-style catchy-effect.
5. **`<picture>` reduced-motion variant** → Plain `<img>` in the live-demo; `<picture>` shown in "Usage → Reduced motion" as an opt-in block for consumers who want it.
6. **target-doc sync** → Status section + roadmap-table annotations only; no architecture-contract edits. Squash SHAs recorded post-merge in a separate commit (out of PR scope).
7. **Workflow YAML validation** → None pre-commit. Baseline `check:repo` file-exists gate + GitHub's own parser on first push is sufficient. Adding `action-validator` / `actionlint` for this PR is overkill (single workflow, no history of YAML bugs).
8. **Feature-memory gate** → `specs/005-dogfood/{spec,plan,tasks}.md` committed in the same commit as the workflow + README changes, so the gate passes against the full PR diff.
9. **Vercel preview** → No-op. No changes to `prototypes/` or `scripts/build-static.mjs`.
10. **New CI scripts** → None. Keep CI surface stable; the baseline-checker extension is the only pipeline touch.

## Step order

### Step 1 — spec folder (this commit)

Files produced: `specs/005-dogfood/spec.md`, `specs/005-dogfood/plan.md`, `specs/005-dogfood/tasks.md`.

Reason it's first: `pnpm run check:feature-memory` runs against any staged product-path change, and the pre-push hook also enforces it. Both must see the spec folder present in the PR diff.

### Step 2 — `.github/workflows/comet-graph.yml`

Final content (shown verbatim so the executor doesn't reinvent it):

```yaml
name: comet-graph
on:
  schedule:
    - cron: "0 3 * * 1"
  workflow_dispatch:
concurrency:
  group: comet-graph
  cancel-in-progress: true
jobs:
  render:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          username: kiaquila
```

No `token` / `reduced` / `branch` overrides needed — `action.yml` defaults match what we want (`${{ github.token }}`, `"true"`, `"comet-graph"`).

Notes for the executor:

- `uses: ./` requires the checkout step to run first (so `action.yml` is on disk).
- `concurrency.cancel-in-progress: true` is safe here because output is idempotent (force-push of the same-shape artifact).
- `timeout-minutes: 5` cap is generous (empty-year ~30s; heavy-user ~90s per PR 004 data).

### Step 3 — `scripts/check-static-baseline.mjs`

Add `.github/workflows/comet-graph.yml` to `requiredFiles`. Single-line insertion after the existing `.github/workflows/osv-scan.yml` entry (alphabetical order not enforced; insertion at the bottom of the `.github/workflows/*` cluster keeps diff-readability).

Regression test: temporarily `git mv` the workflow file aside → `pnpm run check:repo` exits 1 with `Missing required baseline files: - .github/workflows/comet-graph.yml` → restore.

### Step 4 — `README.md` rewrite

Approach: **one full rewrite via Write** rather than five surgical Edits. Reason: top-of-file restructure + two new sections + three edited sections = an Edit sequence large enough that a rewrite is simpler and less error-prone.

Outline, top to bottom (see `spec.md` "README shape" for the full target outline):

1. **Title** — `# comet-contribution-graph`
2. **Tagline** (1 line, same message as current)
3. **Badges** —
   - `[![comet-graph](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/comet-graph.yml/badge.svg)](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/comet-graph.yml)`
   - `[![OSV Scanner](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/osv-scan.yml/badge.svg)](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/osv-scan.yml)`
   - `[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)`
4. **Live demo** — single `<img>` pointing at `raw.githubusercontent.com/kiaquila/comet-contribution-graph/comet-graph/comet.svg` with `alt`. Markdown `![...](...)` form.
5. **`## Usage`**
   - Paragraph (2 lines) — where to install and what happens.
   - YAML snippet (installation in a profile repo):

     ```yaml
     # .github/workflows/comet-graph.yml in <user>/<user>
     name: comet-graph
     on:
       schedule:
         - cron: "0 3 * * 1"
       workflow_dispatch:
     jobs:
       render:
         runs-on: ubuntu-latest
         permissions:
           contents: write
         steps:
           - uses: actions/checkout@v4
           - uses: kiaquila/comet-contribution-graph@main
             with:
               username: <user>
     ```

     Note under snippet: "`v1` tag coming post-MVP; pin to `@main` or a commit SHA for reproducibility."

   - **Embed in your profile README** — Markdown:

     ```markdown
     ![cinematic comet contribution graph](https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet.svg)
     ```

   - **Reduced-motion fallback** (subsection) — HTML `<picture>`:

     ```html
     <picture>
       <source
         media="(prefers-reduced-motion: reduce)"
         srcset="
           https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet-reduced.svg
         "
       />
       <img
         alt="cinematic comet contribution graph"
         src="https://raw.githubusercontent.com/<user>/<user>/comet-graph/comet.svg"
       />
     </picture>
     ```

   - **Inputs** — table with `name` / `required` / `default` / `description` columns, four rows matching `action.yml`:
     - `username` · required · — · "GitHub login to render the graph for"
     - `token` · optional · `${{ github.token }}` · "PAT with `read:user` only if querying another user; default works for owner's own graph"
     - `reduced` · optional · `"true"` · "Also emit `comet-reduced.svg` for `prefers-reduced-motion` fallback"
     - `branch` · optional · `"comet-graph"` · "Output branch; force-pushed on every run"

6. **`## How it works`** — 2–3 sentences:

   > Every run fetches your GitHub contributions via the GraphQL API, passes them through a pure-TS SVG renderer (SMIL-animated comet tracing your most productive days across a constellation of your year), and force-pushes the result to an orphan `comet-graph` branch in this repo. Your profile README embeds the SVG via a stable `raw.githubusercontent.com` URL. See [github-action-target.md](./docs_comet/project/devops/github-action-target.md) for the architecture contract.

7. **`## Concept`** — keep existing four bullets, no edits.
8. **`## Stack`** — rewrite as product stack, not prototype stack:
   - Node 20 GitHub Action, bundled single-file via `@vercel/ncc` (committed at `dist-action/index.js`)
   - Pure-TypeScript SVG renderer (`src/renderer.ts`) with SMIL animation
   - GitHub GraphQL `contributionsCollection` data source (`src/data.ts`)
   - System `monospace` font (embed-safe, no CDN)
   - Prototype (`prototypes/variant-d-grid-peaks.html`) — development preview, deployed to Vercel per-PR
   - CI: GitHub Actions (`baseline-checks`, `guard`, `AI Review`, `OSV Scanner`, `comet-graph` dogfood)

9. **`## Getting started`** — keep existing section.
10. **`## Scripts`** — update table to add (keep existing rows):
    - `pnpm run check:ts` — TypeScript strict-mode compile check
    - `pnpm run build:action` — produce `dist-action/index.js` via ncc
    - `pnpm run check:dist` — verify committed bundle matches source
11. **`## Supply chain`** — keep existing section.
12. **`## Repository layout`** — update tree to include `src/`, `dist-action/`, `action.yml`, note `specs/005-dogfood/` is live:

    ```
    comet-contribution-graph/
    ├── src/                         # Pure-TS Action: renderer, data, entry
    ├── dist-action/                 # Committed ncc bundle (Node 20 single-file)
    ├── prototypes/                  # Standalone HTML prototype
    │   └── variant-d-grid-peaks.html
    ├── scripts/                     # Build and orchestration helpers
    ├── tests/                       # Node test suites + fixtures + snapshots
    ├── specs/<feature-id>/          # Per-feature spec.md / plan.md / tasks.md
    ├── docs_comet/                  # Durable docs, ADRs, devops contracts
    ├── .specify/memory/             # Constitution and process rules
    ├── .github/workflows/           # CI, guard, AI review, OSV scan, dogfood
    ├── action.yml                   # GitHub Action metadata
    ├── vercel.json                  # Vercel build/output configuration
    └── AGENTS.md / CLAUDE.md        # Agent onboarding
    ```

13. **`## Workflow`** — keep existing section (internal-dev workflow).
14. **`## License`** — keep existing section.

### Step 5 — `docs_comet/project/devops/github-action-target.md`

Surgical edits:

1. **Status section** (lines ~9–17): update
   - "PR 004 — Action entrypoint — in review" → "PR 004 — Action entrypoint — MERGED (squash `7225f17`)"
   - "PR 005 — not started; spec not yet written" → "PR 005 — dogfood workflow + README publish — in review"
2. **Roadmap table** (lines ~38–43): annotate
   - 002 row: " ✅ MERGED" suffix
   - 003 row: " ✅ MERGED" suffix
   - 004 row: replace "**In review.**" → "**✅ MERGED.**"
   - 005 row: add "🚧 **In review.**" at end of description cell

No other edits — architecture contract, fixed-design-decisions table, deferred list, action-inputs table, handoff protocol — all remain verbatim.

### Step 6 — verification pass (local)

Order matters here; each gate depends on prior steps:

1. `pnpm run check:feature-memory` — spec folder present, gate passes on full PR diff `origin/main..HEAD`.
2. `pnpm run check:repo` — baseline files all present (including new workflow).
3. `pnpm run format:check` — prettier on new YAML + updated README + updated target-doc + updated baseline script.
4. `pnpm run ci` end-to-end — confirms nothing else broke.
5. Manual: `git diff origin/main -- src/ dist-action/ prototypes/ action.yml package.json pnpm-lock.yaml tsconfig.json` is empty (no bundle/src drift).
6. Manual: `cat .github/workflows/comet-graph.yml` — visually confirm shape matches spec's "Workflow shape" block.

### Step 7 — commit

Single commit on this worktree: `feat(dogfood): comet-graph workflow + README publish (PR 005)`.

Files staged:

- `specs/005-dogfood/spec.md`
- `specs/005-dogfood/plan.md`
- `specs/005-dogfood/tasks.md`
- `.github/workflows/comet-graph.yml`
- `README.md`
- `docs_comet/project/devops/github-action-target.md`
- `scripts/check-static-baseline.mjs`

### Step 8 — code-reviewer pass, then push + Codex review

1. `code-reviewer` subagent on the full PR diff — focus: README inputs-table correctness vs `action.yml`, workflow permissions scope, embed URL spelling, cron syntax. (Low-risk PR; expect verdict APPROVE or minor suggestions.)
2. `git push` → PR opened against `main`.
3. `@codex review` via `gh pr comment` (per memory `feedback_codex_human_trigger`).
4. Iterate on Codex findings — budget: 1–2 cycles for an S PR.
5. After each push: repeat `@codex review` (per `feedback_codex_human_trigger`).

## Validation order

1. Step 1 (spec folder) → `pnpm run check:feature-memory` green.
2. Step 2 (workflow YAML) → `node -e "JSON.stringify(require('yaml').parse(require('fs').readFileSync('.github/workflows/comet-graph.yml','utf8')))"` exits 0 (manual; not a CI gate).
3. Step 3 (baseline extension) → `pnpm run check:repo` green with new workflow in required list; temporarily remove workflow → exit 1 with expected message → restore.
4. Step 4 (README rewrite) → `pnpm run format:check` green.
5. Step 5 (target-doc sync) → `pnpm run format:check` green.
6. Step 6 (verification pass) → full `pnpm run ci` exit 0.
7. Step 7 (commit) → `git log -1 --oneline` shows the conventional-format subject.
8. Step 8 (push + review) → PR opened; `@codex review` comment posted; baseline + guard + AI Review all green on head SHA.

## Risks

- **README embed 404 pre-first-run.** Expected; bounded to ~60 seconds post-merge when `workflow_dispatch` populates the branch. If user wants zero broken state at any moment: bootstrap the branch manually before merging (one-shot `git checkout --orphan comet-graph && touch comet.svg && git push origin comet-graph`). Not in this plan — adds a pre-merge ceremony step.
- **Cron timing overlaps external GitHub events.** `0 3 * * 1` is stable; GitHub may delay scheduled runs by minutes under load but will not skip them.
- **`concurrency.cancel-in-progress: true` cancels manual dispatch mid-run if cron fires.** Unlikely (cron is weekly). Safe either way — the next run is idempotent.
- **Workflow fails on first run due to empty branch.** `src/action.ts` uses `git checkout --orphan` regardless of remote state — it creates the branch if missing. Verified in PR 004.
- **README badges reference a workflow that doesn't yet exist at merge time.** The badge URL resolves after the PR merges and GitHub registers the workflow. Shields.io-style "unknown" state until then. Acceptable.
- **`uses: ./` on a runner that receives the checkout at a path other than `$GITHUB_WORKSPACE`.** All GitHub-hosted runners use `$GITHUB_WORKSPACE`; `actions/checkout@v4` respects it. No risk.
- **Codex over-scrutiny on workflow YAML conventions.** Budget 1–2 cycles; per `feedback_codex_reimplement_tool_rules`, if Codex iterates on formatting minutiae, push back or defer.
- **Pre-push hook blocks push if spec folder is staged in a separate commit.** This plan is a single commit, so no risk — `feedback_check_feature_memory_spec_coupling` pattern: keep spec + product changes in one commit.
- **Vercel preview deploy fails because `README.md` is not a prototype change.** Vercel is scoped to `prototypes/` + `scripts/build-static.mjs`; README changes are no-op for the preview build. Verified in PR 002 shipping.

## Out of bounds

- No changes to `src/**`, `dist-action/**`, `prototypes/**`, `tests/**`, `action.yml`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`.
- No new `.github/workflows/*.yml` beyond `comet-graph.yml`.
- No new CI scripts.
- No ESLint / html-validate / prettier config changes.
- No dependabot / OSV config changes.
- No LICENSE edits.
- No `.gitignore` / `.gitattributes` edits.
- No `.specify/memory/constitution.md` edits.
- No changes to `AGENTS.md` or `CLAUDE.md` (dogfood scope already documented in target-doc).
