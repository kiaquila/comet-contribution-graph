# Tasks — Widget polish v2

## Architect phase

- [ ] Review density-adaptive intensity hypothesis (spec: density-adaptive rMin/rMax via `activeDays/365`, sqrt intensity scaling, opacity floor lerp)
- [ ] Return concrete formula + edge-case analysis (sparse vs dense vs 2-peak-only)
- [ ] Decide: density-axis vs percentile-axis, sqrt vs log, opacity floor values

## Implementation — bug 2 (data-star visibility)

- [ ] `src/normalize.ts`: expose `activeDays` count in `Normalization` result
- [ ] `src/renderer.ts`: remove `if (!d.aboveMedian) continue` from data-star loop
- [ ] `src/renderer.ts`: replace `nonPeakRadius(intensity)` with density-adaptive form per architect brief
- [ ] `src/renderer.ts`: adjust `nonPeakOpacity` floor per architect brief
- [ ] Thread `densityFactor` / `activeDays` through `renderCometSVG` → renderers

## Implementation — bug 1 (month labels)

- [ ] `src/renderer.ts:367` `renderMonthLabels`: track `lastLabelX`, skip label if `x - lastLabelX < 28`

## Snapshot regeneration

- [ ] Run `UPDATE_SNAPSHOTS=1 pnpm run test`
- [ ] Eyeball each of 10 regenerated SVGs (5 fixtures × animated/reduced) — confirm visual intent matches spec
- [ ] `pnpm run test` passes with new snapshots

## Designer + visual-verdict phase

- [ ] `/visual-verdict` before/after for `sparse-user`, `normal-user`, `heavy-user` fixtures
- [ ] Confirm peak-vs-noise hierarchy preserved on each

## Code-reviewer phase

- [ ] Verify acceptance criteria from code (NOT self-reports per `feedback_subagent_checkbox_trust`)
- [ ] SOLID + performance pass
- [ ] Snapshot drift explanation in PR body

## Implementation — README + showcase + version

- [ ] `.github/workflows/showcase-graph.yml`: Staks-sor → `showcase` branch, workflow_dispatch + weekly cron
- [ ] `README.md`: strip Stack / Getting started / Scripts / Supply chain / Repository layout / Workflow sections
- [ ] `README.md`: Node 20 → 24; drop "v1 coming post-MVP"; example pin `@main` → `@v1`
- [ ] `README.md`: add prettier badge
- [ ] `README.md`: repoint hero src to `showcase/comet.svg`
- [ ] `README.md`: add personal-project / closed-to-outside-PRs note
- [ ] `package.json`: version `0.1.0` → `1.1.0`

## Local verification

- [ ] `pnpm run ci` green
- [ ] `node scripts/check-feature-memory.mjs origin/main HEAD` green

## PR + merge

- [ ] Commit on branch `charming-cartwright-67461e`
- [ ] Push + PR open against `main`
- [ ] `@codex review` posted via gh CLI
- [ ] `baseline-checks`, `guard`, `AI Review` all SUCCESS
- [ ] Address Codex findings, iterate as needed
- [ ] Squash merge

## Post-merge

- [ ] `git tag v1.1.0 <squash-sha>` + push
- [ ] `git tag -f v1 <squash-sha>` + `git push --force origin v1`
- [ ] Dispatch `showcase-graph.yml` manually once to populate `showcase` branch
- [ ] Verify hero renders on GitHub

## Out of scope (deferred)

- [ ] Marketplace publish — separate thread
- [ ] CONTRIBUTING.md — repo closed to external contributions
