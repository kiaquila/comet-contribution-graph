# Feature 005 — Dogfood: comet-graph workflow + README publish

## Goal

Ship the first end-to-end run of the Action: a GitHub Actions workflow (`.github/workflows/comet-graph.yml`) that installs this very repo as an Action, runs it weekly + on-demand against the owner's own contributions, force-pushes the generated SVG(s) to the `comet-graph` branch; plus a README overhaul that documents installation for external users and embeds the live dogfood SVG at the top. After this PR merges and the workflow runs once (manual `workflow_dispatch`), anyone can reference `kiaquila/comet-contribution-graph@main` from a workflow in their own profile repo and have their comet graph published at `raw.githubusercontent.com/<user>/<user>/comet-graph/comet.svg`.

## Why

PR 004 shipped the installable Action bundle; until someone actually installs and runs it, we don't know whether the GraphQL fetch, rendering, and orphan push behave correctly end-to-end under real GitHub runner constraints (node 20 subset, public API rate limits, git config defaults, minimum-scope token). The dogfood workflow is the first real integration test — it takes a concrete input (kiaquila's real contributions) and produces a concrete artifact on a branch. It's the final PR in the 4-PR MVP roadmap; after this the repo is ready for external adoption (sans Marketplace listing, which stays post-MVP).

## Dogfood strategy (Option C: A now, B next thread)

This PR implements **Option A** — source-repo dogfood: workflow lives in this repo, runs Action via `uses: ./`, pushes SVG to this repo's `comet-graph` branch, embeds in this repo's README. Validates the Action pipeline automatically via weekly cron; acts as regression guard.

A follow-up **PR 006 (next thread)** will implement **Option B** — profile-repo dogfood: workflow in `kiaquila/kiaquila` installs the Action via `uses: kiaquila/comet-contribution-graph@main`, pushes to the profile repo's own `comet-graph` branch via the profile repo's default `${{ github.token }}` (no PAT needed), embeds in the profile README so the comet graph shows on the GitHub profile page itself. That's the marketing-facing "shopfront" deployment.

Both options use the built-in `${{ github.token }}`; the difference is which repo the workflow lives in. Option A is auto-regression + tech demo; Option B is public showcase. Neither blocks the other.

## Scope

**In scope** (fourth of four PRs toward MVP Action)

- `.github/workflows/comet-graph.yml` — dogfood workflow with:
  - `on: schedule: - cron: '0 3 * * 1'` (Monday 03:00 UTC) + `on: workflow_dispatch:`
  - single `render` job, `runs-on: ubuntu-latest`, `timeout-minutes: 5`, `permissions: { contents: write }`
  - `concurrency: { group: comet-graph, cancel-in-progress: true }` to avoid parallel runs stomping the output branch
  - steps: `uses: actions/checkout@v4` then `uses: ./` with `with: { username: kiaquila }`
- `README.md` — full overhaul:
  - Top-of-file: title + 1-line tagline + badges row (comet-graph workflow status + OSV + license) + live-demo `<img>` embed from this repo's `comet-graph` branch.
  - New `## Usage` section — install-in-profile-repo YAML snippet, profile-README embed snippet (plain `<img>`), optional `<picture>` reduced-motion fallback as a subsection, inputs table matching `action.yml` verbatim.
  - New `## How it works` section — 2–3 sentence dataflow (GraphQL → pure-TS SVG renderer → orphan force-push) with link to `docs_comet/project/devops/github-action-target.md`.
  - Retain (with minor edits): `## Concept`, `## Stack`, `## Getting started`, `## Scripts`, `## Supply chain`, `## Repository layout`, `## Workflow` (internal-dev), `## License`.
  - Remove: "Work in progress — private preview" banner; "No product `index.html` yet" line; "Final deliverable: a published GitHub Action" phrasing (it's shipped now).
- `docs_comet/project/devops/github-action-target.md`:
  - Status section: mark PR 004 as MERGED (squash `7225f17`); mark PR 005 as "in review".
  - Roadmap table: annotate rows 002/003/004 as merged; 005 as in review.
  - No architecture-contract edits — everything is already documented there.
- `scripts/check-static-baseline.mjs` — append `.github/workflows/comet-graph.yml` to `requiredFiles` so future edits can't silently drop the dogfood workflow.

**Out of scope** (deferred)

- Running the workflow in CI-gated pre-merge mode — GitHub does not permit a workflow file to run on the PR that introduces it; first real execution happens after merge via `workflow_dispatch`.
- Marketplace listing + `v1` Action tag — post-MVP per target-doc.
- Profile-repo (`kiaquila/kiaquila`) workflow — **next-thread follow-up PR 006 (Option B of the Option C dogfood strategy)**. Uses profile-repo's own `${{ github.token }}`, no PAT needed. Embeds at the top of the GitHub profile page.
- GIF output (Puppeteer) — post-MVP.
- Cross-user PAT UX in docs beyond mentioning that a PAT is required — post-MVP.
- Playground / landing page — post-MVP.
- `remark-lint` / markdown link-checker tooling — GitHub-side rendering is enough for MVP.
- `check:workflows` YAML parser — GitHub validates on push; adds no value pre-merge.

## Constraints

- **Self-install reference.** Workflow uses `uses: ./` after `actions/checkout@v4`, not a versioned tag. `v1` release happens post-MVP; chicken-and-egg otherwise (tag requires first green run; first run requires workflow on `main`).
- **Minimum-scope permissions.** `permissions: contents: write` declared at job level, not workflow level. No `actions`, `pull-requests`, `issues`, `packages`, `id-token`.
- **Single output branch.** The workflow pushes to the same `kiaquila/comet-contribution-graph` repo's `comet-graph` branch via the Action's built-in `${{ github.token }}` default. No PAT needed for MVP.
- **Prototype + renderer + data + entry + bundle byte-identical.** `prototypes/variant-d-grid-peaks.html`, `src/**`, `dist-action/**`, `action.yml`, `tsconfig.json`, `package.json`, `pnpm-lock.yaml` — zero changes. This PR is workflow + docs only.
- **README embed URL stable.** `https://raw.githubusercontent.com/kiaquila/comet-contribution-graph/comet-graph/comet.svg` — no `?v=...` cache-bust in the repo's own README (documented pattern for external users only).
- **Transient 404 on first render.** Until the first `workflow_dispatch` completes, `comet.svg` does not exist on `comet-graph` branch → README image 404s. Acceptable: post-merge manual trigger populates it within ~60 seconds.
- **CI green end-to-end.** `check:repo` picks up the new workflow (baseline), `format:check` covers `.yml` + `.md`, `check:ts`/`check:js`/`check:html`/`test`/`build`/`build:action`/`check:dist` untouched.
- **Feature-memory gate green.** `specs/005-dogfood/{spec,plan,tasks}.md` committed in this PR.
- **Commit-message style** per CLAUDE.md: subject only, ≤72 chars, `feat(dogfood):` prefix.

## Validation

- `pnpm run ci` green end-to-end locally.
- `pnpm run check:feature-memory` green.
- `node -e "const p = require('yaml').parse(require('fs').readFileSync('.github/workflows/comet-graph.yml','utf8')); console.log(p.jobs.render.permissions)"` (or similar) parses the workflow and prints expected permissions — manual check, not a CI gate.
- `pnpm run format:check` passes on new YAML + updated README.
- `git diff origin/main -- src/ dist-action/ prototypes/ action.yml package.json pnpm-lock.yaml tsconfig.json` is empty.
- PR diff touches only: `specs/005-dogfood/**`, `.github/workflows/comet-graph.yml`, `README.md`, `docs_comet/project/devops/github-action-target.md`, `scripts/check-static-baseline.mjs`.
- **Post-merge (out-of-PR scope)**: `gh workflow run comet-graph.yml` → observe run success → `git fetch origin comet-graph && git ls-tree origin/comet-graph` lists `comet.svg` + `comet-reduced.svg` → README live-demo image resolves in GitHub preview.

## Acceptance

- `.github/workflows/comet-graph.yml` exists, valid YAML, schedule + dispatch triggers, `permissions.contents: write` at job level, uses `./` with `username: kiaquila` input.
- `README.md`: "Work in progress" banner gone; new "Usage" + "How it works" sections present; live-demo embed + badges visible at top; inputs table matches `action.yml` exactly; `<picture>` reduced-motion fallback documented.
- `docs_comet/project/devops/github-action-target.md` Status section reflects 004 MERGED and 005 in review.
- `scripts/check-static-baseline.mjs` includes `.github/workflows/comet-graph.yml` in `requiredFiles`; temporarily removing the workflow file makes `pnpm run check:repo` exit 1.
- `specs/005-dogfood/{spec,plan,tasks}.md` present and internally consistent; feature-memory gate green.
- `pnpm run ci` green end-to-end locally.
- Single commit on the branch with conventional subject.

## Workflow shape (final, subject to user approval)

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

No `token`, `reduced`, `branch` overrides — the Action defaults (from `action.yml`) match what we want: `${{ github.token }}`, `reduced=true`, `branch=comet-graph`.

## README shape (target outline)

1. `# comet-contribution-graph` — title
2. Tagline (1 line, same message as current first line)
3. Badges row: workflow status + OSV + license
4. Live-demo `<img>` from `comet-graph` branch
5. `## Usage` — YAML install snippet, embed snippet, reduced-motion variant, inputs table
6. `## How it works` — 2–3 sentences + link to target-doc
7. `## Concept` — existing content, minor phrasing cleanup
8. `## Stack` — updated: "Node 20 GitHub Action (pure-TS SVG renderer, SMIL animation)", prototype demoted to "development preview"
9. `## Getting started` — existing, unchanged
10. `## Scripts` — table updated with `build:action`, `check:dist`, `check:ts`
11. `## Supply chain` — existing, unchanged
12. `## Repository layout` — updated tree: adds `src/`, `dist-action/`, `action.yml`
13. `## Workflow` — internal-dev, existing, unchanged
14. `## License` — existing, unchanged

## Fixed design decisions (user-to-approve before executor runs)

| Decision                      | Value                                                                                                                 | Rationale                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dogfood target repo (this PR) | **This repo** (`kiaquila/comet-contribution-graph`), `comet-graph` branch — Option A of the Option C dogfood strategy | Default `${{ github.token }}` works with zero secrets setup. Provides weekly auto-regression via cron. Option B (profile-repo `kiaquila/kiaquila`) is next-thread PR 006. |
| Embed URL                     | `https://raw.githubusercontent.com/kiaquila/comet-contribution-graph/comet-graph/comet.svg`                           | Matches dogfood-target decision; stable; camo-cacheable.                                                                                                                  |
| Cron schedule                 | `0 3 * * 1` (Monday 03:00 UTC)                                                                                        | Low-traffic window; weekly aligns with real contribution cadence.                                                                                                         |
| `workflow_dispatch`           | Enabled                                                                                                               | Manual retrigger for post-merge bootstrap + ad-hoc refresh.                                                                                                               |
| Action ref in workflow        | `uses: ./` after `actions/checkout@v4`                                                                                | Self-reference; avoids chicken-egg with `v1` tag before first green run. External users get `kiaquila/comet-contribution-graph@main` snippet in Usage docs.               |
| Permissions                   | Job-level `contents: write`                                                                                           | Minimum viable; no other scopes needed for orphan push.                                                                                                                   |
| Concurrency                   | `group: comet-graph, cancel-in-progress: true`                                                                        | Prevents parallel runs racing on the output branch (weekly + manual dispatch can overlap).                                                                                |
| Job timeout                   | `timeout-minutes: 5`                                                                                                  | Empty-year run completes in <60s; heavy-user in <90s (per 004 spec). 5-min ceiling catches stuck runs without flakiness.                                                  |
| README embed shape            | Plain `<img>` in live-demo; `<picture>` in "Usage → Reduced motion" subsection                                        | Simpler default; reduced-motion users get optional block. Matches target-doc pattern.                                                                                     |
| Transient 404 pre-first-run   | Accepted                                                                                                              | Broken image for ~60s post-merge until `workflow_dispatch` populates the branch. Badge still renders workflow status.                                                     |
| Badges                        | Comet-graph workflow status + OSV-scan + MIT license                                                                  | Surfaces render health + security + licensing at a glance.                                                                                                                |
| Workflow YAML validation      | None pre-commit; rely on baseline file-exists + GitHub-side parser on first push                                      | `action-validator` / `actionlint` adds tooling for zero new bug-class coverage in MVP.                                                                                    |
| Tests                         | No new test files                                                                                                     | Orchestration covered by `tests/action.test.mjs` (PR 004); workflow YAML is declarative config; README is doc-only.                                                       |
| target-doc SHA for 005        | `TBD` in PR; post-merge update is out-of-PR scope                                                                     | Squash SHA is unknown before merge.                                                                                                                                       |
| Commit strategy               | Single commit on the worktree, spec + workflow + README + docs together                                               | Matches PR 003/004 discipline.                                                                                                                                            |
| Commit subject                | `feat(dogfood): comet-graph workflow + README publish (PR 005)`                                                       | ≤72 chars, conventional prefix.                                                                                                                                           |

## Non-goals

- **No "run the workflow before merge" gate.** GitHub does not run a workflow file from a PR checkout on workflow-level events; first real run happens post-merge.
- **No cross-user testing matrix.** Dogfood is for `username: kiaquila`; external-user correctness is covered by existing unit tests on `fetchContributions` + renderer.
- **No `act`/Docker-based integration test for the workflow.** MVP relies on Action unit tests (PR 004) + the first live run post-merge.
- **No retry/alert on render failure.** `setFailed` flips the workflow run state red; GitHub emails the repo owner. No PagerDuty-style escalation for MVP.
- **No notification on successful render.** GitHub run history is enough for dogfood visibility.
- **No commit-signing on the orphan push.** Uses the Action's built-in identity (`comet-graph-bot`, set in `src/action.ts`).
- **No multi-language README / i18n.** English only.
- **No image-diff regression gate for the rendered SVG.** Snapshot tests (PR 002) cover renderer behavior at code level; human-eyeball is the MVP gate for real-data output.
