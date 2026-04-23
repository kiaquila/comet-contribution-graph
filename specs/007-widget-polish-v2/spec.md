# Feature 007 — Widget polish v2: post-v1 visual fixes + README cleanup

## Goal

Fix two visual bugs surfaced after the v1 profile deploy (month labels colliding, non-peak data-stars invisible), swap the README hero to a denser showcase graph (Staks-sor), and strip the README of internal dev content so it reads as a public product page. Bump to v1.1.0.

## Why

After v1 shipped and started running on `kiaquila/kiaquila` profile, two prod-only bugs surfaced and the README began attracting outside views:

- **Month-label overlap**: "Apr" prints on top of "May" in the top axis when a new month lands in a column adjacent to the previous month boundary.
- **Hidden data stars**: only peak stars render on kiaquila's sparse year (175 contribs). The author quote: "виджет не отражет реальные данные контрибьюшнов, а отражает только пики ... там тоже должны быть звезды, но поменьше. Так как вклад был меньше. Но сейчас их вообще нет." Root cause: median filter at `src/renderer.ts:512` drops every non-peak active day whose count is ≤ median; for sparse users median ≈ 1, so count=1 days vanish entirely.
- **README mixes product surface with dev process**: Stack / Getting started / Scripts / Supply chain / Repository layout / Workflow sections leak internal orchestration to first-time readers; hero still reads "Node 20" and "v1 coming post-MVP".
- **Visual impact of hero**: kiaquila's own graph is sparse by design; Staks-sor has a denser profile and produces a more cinematic sky for marketing purposes.
- **External contributions not desired**: project is personal; outside PRs create review overhead without value. Platane/snk-style policy note replaces CONTRIBUTING.md.

## Scope

**In scope**

1. `src/renderer.ts` — `renderMonthLabels` minimum-gap between adjacent labels.
2. `src/renderer.ts` + `src/normalize.ts` — data-star visibility: remove or density-gate the `aboveMedian` filter, reshape `nonPeakRadius` / `nonPeakOpacity` so every active day renders with a count-proportional visual weight. Normalization must remain relative to the author's own distribution (memory `project_relative_normalization_rule`).
3. `.github/workflows/showcase-graph.yml` — render `Staks-sor` to `showcase` branch for README hero.
4. `README.md` — remove Stack / Getting started / Scripts / Supply chain / Repository layout / Workflow; update Node 20 → 24; drop "v1 coming post-MVP"; pin example to `@v1`; add prettier badge; add "personal project, external PRs not accepted" note; repoint hero to `showcase` branch.
5. `package.json` — version bump `0.1.0` → `1.1.0`.
6. `tests/__snapshots__/*.svg` — regenerate via `UPDATE_SNAPSHOTS=1` after eyeballed review.

**Out of scope**

- Marketplace publish (separate thread per user).
- CONTRIBUTING.md creation (repo closed to external contributions).
- Animation timing, theme, or comet-path changes.
- Action API additions.
- Data-layer or fetcher changes.

## Constraints

- No new runtime dependencies.
- Snapshots are the source of truth for deterministic render output; diffs must be eyeballed (memory `feedback_prototype_port_audit`) before commit.
- Guard requires spec/plan/tasks present (memory `feedback_guard_requires_specs_for_chores`).
- Commit messages: subject-only, conventional prefix (CLAUDE.md convention).
- Relative normalization principle preserved: no absolute count thresholds.

## Validation

- Visual verdict on `sparse-user`, `normal-user`, `heavy-user` fixtures — side-by-side before/after using `/visual-verdict`.
- `pnpm run ci` green locally.
- `node scripts/check-feature-memory.mjs origin/main HEAD` passes.
- Manual browser check of `dist/index.html` prototype after build.
- After PR open: `@codex review` trigger, `baseline-checks`, `guard`, `AI Review` all SUCCESS.
- After merge: tag `v1.1.0`, move `v1` to same commit.

## Acceptance

- No two month labels render at `x`-distance < 28 px.
- On `sparse-user` fixture (kiaquila-like, 175 active days), every active day that is not a peak renders as a visible star; star radius varies continuously with `count`.
- On `heavy-user` fixture, sky remains readable (no perceptible overlap clusters); peaks still dominate visually.
- `showcase-graph.yml` runs successfully on dispatch; `showcase` branch contains `comet.svg` + `comet-reduced.svg` for Staks-sor.
- README contains: title, hero, badges (CI + prettier + license), Usage, Embed snippet, Reduced-motion fallback, Inputs table, How it works, Concept, personal-project note, License. Nothing else.
- `package.json` reports `1.1.0`.
- Snapshot tests green with regenerated SVGs.
