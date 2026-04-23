# Plan — Widget polish v2

## Approach

Single PR on branch `charming-cartwright-67461e`. Two risk surfaces: (A) the data-star algorithm change (visual fidelity on sparse + dense) and (B) README restructuring (tone, not touching any code path). Handle (A) with `architect` → `executor` → `designer`/`/visual-verdict` → `code-reviewer`. Handle (B) with a single `executor` pass; no subagents.

## OMC pipeline

1. **architect** — review the density-adaptive intensity hypothesis (removal of `aboveMedian` filter + sqrt-based radius + density-aware min/max radius) against alternatives; return a concrete formula + edge-case analysis.
2. **executor** — surgical edits to `src/renderer.ts` + `src/normalize.ts` (bug 1 + 2), `UPDATE_SNAPSHOTS=1` regenerate, eyeball diffs.
3. **designer** + `/visual-verdict` — before/after screenshots for sparse/normal/heavy fixtures.
4. **code-reviewer** — SOLID + performance + snapshot drift review.
5. **executor** — README cleanup + `showcase-graph.yml` + prettier badge + package.json bump (no subagent review needed; docs change).

## Key design hypothesis (for architect validation)

User's direction: "Кто-то контрибутит часто, а кто-то иногда и у тех, и у других должно получаться красивое, нормализованное небо исходя из их вклада." → density-adaptive normalization.

**Proposal:**

- Remove `if (!d.aboveMedian) continue` from `src/renderer.ts:512` — every active non-peak day renders.
- Replace `nonPeakRadius(intensity, densityFactor)` with density-adaptive form:
  - `densityFactor = clamp(activeDays / 365, 0.15, 1.0)`
  - `rMin = lerp(1.2, 0.7, densityFactor)` — sparse user: small floor 1.2; dense user: 0.7 so noise doesn't crowd.
  - `rMax = lerp(2.2, 1.8, densityFactor)` — **REVISED by architect**: rMax lowered from (2.8, 2.0) to (2.2, 1.8) to guarantee non-peak max stays at least 0.32 px below peak sphereR (2.46 sparse) — preserves size hierarchy. Previous (2.8, 2.0) inverted hierarchy: sparse non-peak r=2.68 > peak sphereR=2.46.
  - `r = rMin + sqrt(intensity) * (rMax - rMin)` — sqrt confirmed over cbrt (overdistends low) and log (underdistends mid).
- Raise opacity floor: `opacity = lerp(0.55, 0.35, densityFactor) + sqrt(intensity) * 0.3` — sparse: count=1 stays visible; dense: count=1 dims into bg.
- Expose `activeDays` count out of `normalize` so renderer computes `densityFactor`. Type: add `activeDays: number` to `Normalization`.
- `nonPeakFill`: **leave unchanged** (architect verdict — HSL lightness 28-82% already spans all profiles adequately; applying sqrt would over-brighten low-count stars).

**Peak stays dominant**: peak `sphereR = haloR * 0.6` at haloR 3.5-5.9 → sphere 2.1-3.5 + rayLen 5-9; non-peak max r = 2.14 (sparse) with no ray halo → peaks remain clearly hierarchical at all density levels.

**Architect verdict (2026-04-23)**: proceed with this formula. All 7 review questions answered; 5 fixture edge cases validated (sparse/normal/heavy + 2 pathological). No performance concern. No O(n²) risk. Code smell flagged: `intensity=0` coupling for peaks in normalize.ts:53 — add one-line comment on write.

## Month-label fix (bug 1)

`src/renderer.ts:367` `renderMonthLabels`: track `lastLabelX`, skip label if `x - lastLabelX < MIN_LABEL_GAP_PX (28)`. Preserves correct month positions where space allows.

## README restructure

**Keep**: H1 + tagline, hero (repoint to `showcase/comet.svg`), badges (CI + prettier + license), Usage (workflow snippet + Embed + Reduced-motion + Inputs table), How it works (1 paragraph), Concept bullets, Personal-project note, License.

**Remove**: Stack, Getting started, Scripts, Supply chain, Repository layout, Workflow sections. Drop references to `docs_comet/`, `AGENTS.md`, `CLAUDE.md`, `specs/` from the README (these stay in the repo for the author).

**Update**: Node 20 → Node 24 (where kept), drop "v1 tag coming post-MVP" line, change example pin `@main` → `@v1`.

**Add**: `[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)` next to existing badges. Personal-project note (Platane/snk-style):

> This is a personal project, maintained solo. Feel free to open issues for bugs you hit, but please do not submit pull requests — I'm not accepting external contributions at this time.

## Showcase workflow

New file `.github/workflows/showcase-graph.yml`:

- Trigger: `workflow_dispatch` + weekly cron (different slot from dogfood to avoid contention).
- Runs `uses: ./` with `username: Staks-sor` + `branch: showcase`.
- Permissions: `contents: write`.

Keep `comet-graph.yml` (dogfood kiaquila → `comet-graph` branch) intact — validates sparse-user end-to-end.

## Version bump

`package.json:3` → `"version": "1.1.0"`. Git tag after merge: `git tag v1.1.0 <sha>` + `git tag -f v1 <sha>` + `git push origin v1.1.0 -f v1` (major-tag convention).

## Validation order

1. `architect` brief returned → apply corrections to plan (memory `feedback_no_redundant_replans` — deltas only, no full re-plan).
2. `executor` edits src/ + regenerates snapshots.
3. Eyeball snapshot diffs; run `pnpm run test`.
4. `designer`/`/visual-verdict` before/after on 3 fixtures.
5. `code-reviewer` pass — verify acceptance criteria FROM CODE, not self-reports (memory `feedback_subagent_checkbox_trust`).
6. `executor` README + showcase workflow + badge + version bump.
7. Local: `pnpm run ci` + `node scripts/check-feature-memory.mjs origin/main HEAD`.
8. Commit, push, `@codex review`.
9. Await required checks SUCCESS.
10. Merge (squash).
11. Tag `v1.1.0`, move `v1`.

## Risks

- **Snapshot churn**: all 10 snapshots (5 fixtures × 2 variants) will diff. Review each visually before commit, not just accept via `UPDATE_SNAPSHOTS=1`.
- **Heavy-user clutter**: removing `aboveMedian` filter for dense users could visually overload. Density-adaptive opacity/radius should compensate; verify on `heavy-user` fixture.
- **Staks-sor rate limit or profile visibility**: showcase workflow uses `github.token` with default `contents:write` on own repo; GraphQL works for any public profile. First manual dispatch confirms.
- **Peak-vs-noise overlap**: when rMax=2.8 for sparse users, a non-peak count=maxActive day could visually compete with a peak. Test on sparse + edge-2-peak fixtures.
- **Marketplace publish deferral**: not in scope; new thread handles the release form.

## Out of bounds

- CONTRIBUTING.md (per user: repo closed, policy note in README is enough).
- Marketplace publish.
- Changes to animation timings, comet path, theme.
- New Action inputs.
