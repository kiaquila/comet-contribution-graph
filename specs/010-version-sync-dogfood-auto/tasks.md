# 010 — tasks

## Pre-merge (this PR)

- [ ] T1. Create branch `chore/010-version-sync-dogfood-auto` off `main`.
- [ ] T2. Write spec triad in `specs/010-version-sync-dogfood-auto/`
      (this file + `spec.md` + `plan.md`).
- [ ] T3. Bump `package.json` version `1.2.0` → `1.3.1`.
- [ ] T4. Swap README hero image URL
      `.../showcase/comet.svg` → `.../comet-graph/comet.svg`.
- [ ] T5. Edit `.github/workflows/comet-graph.yml`: add `push` trigger
      on `main` with `paths:` filter (`src/**`, `dist-action/**`,
      `action.yml`, `scripts/fetch-contributions.mjs`).
- [ ] T6. Run `pnpm run ci` locally — expect all green.
- [ ] T7. Run `node scripts/check-feature-memory.mjs origin/main HEAD` —
      expect green (spec triad present).
- [ ] T8. Commit with conventional prefix `chore:` — subject only,
      ≤72 chars. No body.
- [ ] T9. Push branch, open PR with 1-2 sentence body referencing this
      spec.
- [ ] T10. Post `@codex review` inline via `gh pr comment` per project
      memory (`feedback_codex_human_trigger`).
- [ ] T11. Wait for full check suite (CI, OSV Scanner, PR Guard, AI
      Review). Fix P1/P2 Codex findings if any.
- [ ] T12. Merge via `gh pr merge --squash` (no `--delete-branch` from
      worktree — project memory `feedback_gh_pr_merge_delete_branch_worktree`).

## Post-merge

- [ ] T13. `gh workflow run comet-graph.yml -R kiaquila/comet-contribution-graph`
      — backfills the `comet-graph` branch with v1.3.0 + kiaquila SVG
      so the README hero's new URL loads fresh content.
- [ ] T14. Verify the dispatch run completes green, then verify
      `comet-graph` branch head moved past `2026-04-22`.
- [ ] T15. `gh workflow run comet-graph.yml -R kiaquila/kiaquila` —
      refreshes the user's profile with the v1.3.0 renderer.
- [ ] T16. Verify profile run completes green.
- [ ] T17. Tag v1.3.1 at the post-merge `main` HEAD, move `v1` to the
      same SHA, push both tags.
- [ ] T18. `gh release create v1.3.1 --title "v1.3.1 — chore: version sync + auto-dogfood" --notes "…"`.
- [ ] T19. Remind user: tick "Publish this release to the GitHub
      Marketplace" checkbox via the web UI (per memory
      `feedback_marketplace_release_checkbox`).
- [ ] T20. Delete `experiment/009-comet-tail` remote branch:
      `gh api -X DELETE repos/kiaquila/comet-contribution-graph/git/refs/heads/experiment/009-comet-tail`.
- [ ] T21. Confirm `git ls-remote --heads origin` no longer lists the
      experiment branch.
