# 011 — tasks

## Pre-merge (this PR)

- [ ] T1. Branch `claude/ecstatic-shannon-d60246` (already created by
      worktree); spec triad written under
      `specs/011-pipeline-gate-trusted-base/`.
- [ ] T2. Edit `.github/workflows/ai-review.yml` — add
      `ref: ${{ github.event.repository.default_branch }}` to the
      `actions/checkout` step.
- [ ] T3. Edit `.github/workflows/pr-guard.yml` — replace the
      `inputs.ref || head.sha || github.sha` cascade with
      `ref: ${{ github.event.repository.default_branch }}`. Add a
      `git fetch origin "${{ github.event.pull_request.head.sha }}"`
      step gated on `github.event_name == 'pull_request'` so the diff
      and cat-file probes can reach the PR head.
- [ ] T4. Refactor `scripts/check-feature-memory.mjs`:
      replace `existsSync(...specs/<id>/*.md)` with a
      `git cat-file -e <headRef>:<path>` helper for the ref-based
      mode. Keep `existsSync` only inside the `--worktree` branch.
- [ ] T5. Run `node scripts/check-feature-memory.mjs origin/main HEAD`
      locally — expect green.
- [ ] T6. Run `pnpm run ci` locally — expect green (in particular
      `format:check` and `test`).
- [ ] T7. Commit with `fix(ci):` prefix, subject ≤72 chars, no body.
- [ ] T8. Push branch.
- [ ] T9. Open PR. Body: 1–2 sentences referencing this spec, plus an
      explicit note that the PR's own `pr-guard` / `AI Review` run is
      expected to fail because `main` still serves the pre-fix
      scripts. Cite the audit table for context.
- [ ] T10. Post `@codex review` inline via `gh pr comment` per project
      memory (`feedback_codex_human_trigger`). Codex review will run
      against `main`'s pre-fix scripts and may fail; that is fine.
- [ ] T11. Merge via `gh pr merge --squash` (no `--delete-branch`
      from worktree — project memory
      `feedback_gh_pr_merge_delete_branch_worktree`).

## Post-merge

- [ ] T12. Inspect the next unrelated PR's `pr-guard` and `AI Review`
      runs to confirm the new ref-aware path is healthy.
- [ ] T13. Open follow-up issues / specs for the deferred items
      (lockfile + `check:repo` PR validation; cross-repo port to
      `pallete-maker` if the maintainer wants it).
