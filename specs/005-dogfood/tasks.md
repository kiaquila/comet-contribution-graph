# Tasks — Dogfood (workflow + README publish)

## Spec folder (this commit)

- [ ] `specs/005-dogfood/spec.md` — written (this task is complete if the file exists and matches the spec in this PR)
- [ ] `specs/005-dogfood/plan.md` — written
- [ ] `specs/005-dogfood/tasks.md` — written (this file)

## Workflow file

- [ ] Create `.github/workflows/comet-graph.yml` with:
  - [ ] `name: comet-graph`
  - [ ] `on.schedule: - cron: "0 3 * * 1"`
  - [ ] `on.workflow_dispatch: {}`
  - [ ] `concurrency: { group: comet-graph, cancel-in-progress: true }`
  - [ ] `jobs.render.runs-on: ubuntu-latest`
  - [ ] `jobs.render.timeout-minutes: 5`
  - [ ] `jobs.render.permissions: { contents: write }` (job-level, not workflow-level)
  - [ ] Step 1: `uses: actions/checkout@v4`
  - [ ] Step 2: `uses: ./` with `with: { username: kiaquila }` (other inputs default)
  - [ ] 2-space indent throughout, no tabs; trailing newline
- [ ] Verify YAML parses by pasting into any YAML linter or `node --input-type=module -e "import('yaml').then(m=>console.log(m.parse(require('fs').readFileSync('.github/workflows/comet-graph.yml','utf8'))))"`

## Baseline gate extension

- [ ] Open `scripts/check-static-baseline.mjs`
- [ ] Append `".github/workflows/comet-graph.yml"` to the `requiredFiles` array (alongside the other `.github/workflows/*` entries)
- [ ] Verify: temporarily `mv .github/workflows/comet-graph.yml /tmp/` → `pnpm run check:repo` exits 1 with `- .github/workflows/comet-graph.yml` in the missing-files list → restore

## README rewrite

- [ ] Overwrite `README.md` (single `Write` call; Edit sequence is too fragmented for this scope)
- [ ] Top-of-file order:
  - [ ] `# comet-contribution-graph`
  - [ ] Tagline: "A cinematic GitHub contribution graph. A comet traces your most productive days across a constellation of your year."
  - [ ] Badges row (3 badges; single line, markdown):
    - [ ] `[![comet-graph](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/comet-graph.yml/badge.svg)](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/comet-graph.yml)`
    - [ ] `[![OSV Scanner](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/osv-scan.yml/badge.svg)](https://github.com/kiaquila/comet-contribution-graph/actions/workflows/osv-scan.yml)`
    - [ ] `[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)`
  - [ ] Live demo image (Markdown form): `![cinematic comet contribution graph](https://raw.githubusercontent.com/kiaquila/comet-contribution-graph/comet-graph/comet.svg)`
- [ ] Remove "Work in progress — private preview" line entirely
- [ ] Remove "No product `index.html` yet — the prototype is the working artifact." line
- [ ] Rephrase "Final deliverable: a published GitHub Action..." → "This repo ships the public Action..."
- [ ] Add `## Usage` section with:
  - [ ] 2-line intro (where to install, what happens)
  - [ ] YAML snippet for profile-repo workflow, using `kiaquila/comet-contribution-graph@main` and `username: <user>` placeholder (match the workflow shape from spec; permissions at job level)
  - [ ] Note line: "`v1` tag coming post-MVP; pin to `@main` or a commit SHA for reproducibility."
  - [ ] "Embed in your profile README" subsection with Markdown `<img>` snippet (user/user/comet-graph/comet.svg)
  - [ ] "Reduced-motion fallback" subsection with `<picture>` snippet (comet-reduced.svg + comet.svg)
  - [ ] "Inputs" subsection — table with columns `name | required | default | description`, four rows verbatim from `action.yml`:
    - [ ] `username` · required · — · "GitHub login to render the graph for"
    - [ ] `token` · optional · `${{ github.token }}` · "PAT with `read:user` only if querying another user; default works for owner's own graph"
    - [ ] `reduced` · optional · `"true"` · "Also emit `comet-reduced.svg` for `prefers-reduced-motion` fallback"
    - [ ] `branch` · optional · `"comet-graph"` · "Output branch; force-pushed on every run"
- [ ] Add `## How it works` section (2–3 sentences about dataflow, link to target-doc)
- [ ] Retain `## Concept` section verbatim
- [ ] Rewrite `## Stack` section to reflect Node 20 Action + pure-TS renderer + SMIL + GraphQL data source + prototype-as-preview + CI (5–6 bullets)
- [ ] Retain `## Getting started` section verbatim
- [ ] Update `## Scripts` table — add rows for `check:ts`, `build:action`, `check:dist` (keep existing rows)
- [ ] Retain `## Supply chain` section verbatim
- [ ] Update `## Repository layout` tree to include `src/`, `dist-action/`, `action.yml` (see plan for exact tree)
- [ ] Retain `## Workflow` (internal-dev) section verbatim
- [ ] Retain `## License` section verbatim (with 2026 Kristina Aquila attribution)
- [ ] Final sanity: all markdown links resolve to real paths (`./LICENSE`, `./AGENTS.md`, `./docs_comet/README.md`, `./docs_comet/project/devops/github-action-target.md`)
- [ ] Run `pnpm run format:check` — prettier must be happy; if it complains, apply `pnpm exec prettier --write README.md` before recommitting

## target-doc sync

- [ ] Open `docs_comet/project/devops/github-action-target.md`
- [ ] Status section — update 004 row: "in review" → "MERGED (squash `7225f17`)"
- [ ] Status section — update 005 row: "not started; spec not yet written" → "dogfood workflow + README publish (Option A of Option C dogfood strategy) — in review"
- [ ] Roadmap table row 002 — append " ✅ MERGED" to description cell
- [ ] Roadmap table row 003 — append " ✅ MERGED" to description cell
- [ ] Roadmap table row 004 — replace `**In review.**` with `**✅ MERGED.**`
- [ ] Roadmap table row 005 — append `🚧 **In review.**` to description cell
- [ ] Add a new subsection `## Near-term follow-ups (post-PR-005)` below the "4-PR roadmap" section (before "Fixed design decisions"), containing one bulleted entry:
  - **PR 006 — profile-repo dogfood (Option B of Option C strategy).** Install the Action in `kiaquila/kiaquila` profile repo via `uses: kiaquila/comet-contribution-graph@main`; push SVG to the profile repo's own `comet-graph` branch using that repo's default `${{ github.token }}` (no PAT required for self-deploy). Embed `comet.svg` at the top of the profile README so the comet graph appears on the GitHub profile page. Coexists with Option A: A is automated regression (weekly cron in source repo); B is public showcase.
- [ ] Do NOT touch architecture contract, fixed-design-decisions, deferred list, action-inputs table, handoff protocol — all verbatim
- [ ] Run `pnpm run format:check` on the updated file

## Verification (local)

- [ ] `pnpm run check:feature-memory` — green (spec folder in PR diff)
- [ ] `pnpm run check:repo` — green (baseline incl. new workflow)
- [ ] `pnpm run check:html` — green (prototype untouched)
- [ ] `pnpm run check:js` — green (no JS changes)
- [ ] `pnpm run check:ts` — green (no TS changes)
- [ ] `pnpm run build` — green
- [ ] `pnpm run build:action` — green (no src/action.ts changes → ncc output byte-stable)
- [ ] `pnpm run check:dist` — green (committed bundle matches source)
- [ ] `pnpm run format:check` — green (prettier on README + YAML + target-doc + baseline.mjs)
- [ ] `pnpm test` — green (existing tests, unchanged)
- [ ] `pnpm run ci` — green end-to-end
- [ ] `git diff origin/main -- src/ dist-action/ prototypes/ action.yml package.json pnpm-lock.yaml tsconfig.json` — empty
- [ ] PR diff touches only: `specs/005-dogfood/**`, `.github/workflows/comet-graph.yml`, `README.md`, `docs_comet/project/devops/github-action-target.md`, `scripts/check-static-baseline.mjs`

## Code-reviewer + PR + review cycles

- [ ] `code-reviewer` subagent pass on full PR diff — focus:
  - [ ] README inputs table exactly matches `action.yml` input names, requiredness, defaults, descriptions
  - [ ] Workflow permissions are declared at job level (not workflow level)
  - [ ] Embed URL spelling consistent across live-demo, Usage embed snippet, reduced-motion fallback
  - [ ] Cron syntax `0 3 * * 1` is Monday 03:00 UTC (not Sunday — day-of-week starts at 0=Sunday in cron, 1=Monday)
  - [ ] YAML indentation consistent (2 spaces)
  - [ ] No typos in "kiaquila" repo handle
- [ ] Single commit: `feat(dogfood): comet-graph workflow + README publish (PR 005)` (subject only, no body unless reviewer surfaces a why)
- [ ] Pre-push hook passes (`check-feature-memory-on-push.sh`)
- [ ] `git push -u origin claude/practical-archimedes-fcfbdd`
- [ ] `gh pr create --title "feat(dogfood): comet-graph workflow + README publish (PR 005)" --body-file <filename>` with summary + test plan
- [ ] `gh pr comment <pr#> --body "@codex review"` (per memory `feedback_codex_human_trigger`)
- [ ] After each subsequent push (fix cycle): repeat `@codex review`
- [ ] `baseline-checks`, `guard`, `AI Review` green on PR head SHA
- [ ] Vercel preview green (no-op — prototype unchanged)
- [ ] All blocking Codex findings (`P0`–`P2`) resolved; verdict from Codex summary comment, not inline-comment count (per memory `feedback_codex_inline_pinned_to_head`)
- [ ] PR merged via squash

## Post-merge (out-of-PR-scope — for the user to run, not executor)

- [ ] `gh workflow run comet-graph.yml --repo kiaquila/comet-contribution-graph` — manual first dispatch
- [ ] Observe run completion (<2 min)
- [ ] `git fetch origin comet-graph && git ls-tree origin/comet-graph` — lists `comet.svg` + `comet-reduced.svg`
- [ ] Open this repo's README on GitHub — live-demo image resolves (no more 404)
- [ ] `curl -sI https://raw.githubusercontent.com/kiaquila/comet-contribution-graph/comet-graph/comet.svg` — `200 OK`

## Out of scope (deferred)

- [ ] `v1` Action tag + release notes — post-MVP
- [ ] Marketplace listing — post-MVP
- [ ] Profile-repo (`kiaquila/kiaquila`) workflow — **next-thread PR 006 (Option B of Option C dogfood strategy)**; no PAT needed — uses profile repo's own `${{ github.token }}`
- [ ] GIF output variant — post-MVP (Puppeteer ~150MB)
- [ ] Playground / landing page — post-MVP
- [ ] Cross-user PAT UX beyond the "token input" row in the README inputs table — post-MVP
- [ ] `act` / Docker-based integration test — rely on PR 004 action unit tests + first live run post-merge
- [ ] `remark-lint` / `markdown-link-check` tooling — GitHub rendering is sufficient MVP-gate
- [ ] `actionlint` / `action-validator` — GitHub native YAML parser catches syntax errors on push
- [ ] Post-merge: update target-doc with 005 squash SHA — separate commit, not in this PR
- [ ] Image-diff regression gate for rendered SVG — renderer snapshot tests (PR 002) cover code-level correctness
