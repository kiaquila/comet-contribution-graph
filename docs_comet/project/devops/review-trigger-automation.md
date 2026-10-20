# Review Trigger Automation

> Audience: all agents. **Canonical source** for: bot-trigger rejection matrix, Tier 1 (active) recovery path. Tier 2/3 design: see `docs_comet/adr/` when recorded.

## Problem

All three supported review backends reject bot-posted trigger comments on `pull_request: synchronize` events:

- **Codex** — the connector replies `trigger did not come from a connected human Codex account`.
- **Gemini** — `gemini-code-assist[bot]` silently ignores bot-posted `/gemini review` comments.
- **Claude** — `claude-review.yml` gates on `author_association in (OWNER, MEMBER, COLLABORATOR)` and drops bot-authored comments.

Only Gemini Code Assist auto-reviews PRs on `opened` / `ready_for_review`. With `AI_REVIEW_AGENT=codex` (current default) or `claude`, **even the first review on PR open requires a human-authored trigger** — the gate runs with `trigger_mode=skip` on `pull_request` events and fails fast when no trusted current-head review-request marker or review evidence exists. Every subsequent push likewise requires a human-authored trigger for all three backends.

## Core Insight

The backends check whether the comment's `author_association` is a human role (`OWNER`, `MEMBER`, `COLLABORATOR`) and whether the posting account is a human GitHub account — NOT whether the auth is a PAT vs GitHub App token. A fine-grained Personal Access Token (PAT) belonging to the repository owner IS treated as a human trigger.

## Tier 1 — Manual local wrapper (active, zero secrets)

Canonical recovery path. Use on every push that needs a re-review:

```
pnpm run review:switch -- --to <agent>
```

The script:

1. flips the `AI_REVIEW_AGENT` repository variable if different from current
2. posts the correct native trigger comment (`@codex review <full-head-sha>` or `/gemini review <full-head-sha>`) using the local `gh` CLI auth — human-authored, therefore trusted
3. records a trusted current-head review-request marker through `AI Command Policy`
4. uses the shared rerun selector for the latest `AI Review` run on the exact PR head; active runs and already-evaluated signals are deduplicated

When the selected backend posts trusted review evidence, `AI Review Rerun`
reruns the required `AI Review` check again so it can validate the evidence
without a long polling window.

Both `created` and `edited` native receipt and summary-comment events reach the
workflow and runtime identity filter. Edited comments use `updated_at` for
wakeup even when their `created_at` predates the current request. Wakeup is not
acceptance: evidence validation remains in the trusted gate.

When evidence arrives during an active gate, the `AI Review` `workflow_run`
completion observer reloads trusted evidence and request-marker timestamps. It
requeues only a signal at or after the latest attempt's `run_started_at`;
following attempts therefore cannot loop on unchanged evidence. New negative
evidence can also recheck a previous success. Selection uses the newest run,
never an older failure hidden behind a newer success. Wakeups are serialized;
live PR HEAD is checked before selection and immediately before rerun.

The workflow completion observer only handles the repository's `AI Review`
`pull_request` workflow path. It reads PR metadata and review evidence and
executes scripts checked out from the default branch; PR code and artifacts are
never executed by this privileged path.

### First rollout of review-parser changes

A parser change in a PR cannot teach the default-branch gate its new format.
A genuine compatible formal review can unblock an ordinary rerun. PR #55 instead
received only the new native receipt, so its existing `pull_request` job uses a
narrowly scoped exception for this first deployment:

- The validator is pinned to `5773da6b5b93d5f91486b2c6d631e56faea4da44`,
  already reviewed by the native connector in
  [receipt 6203485501](https://github.com/kiaquila/comet-contribution-graph/pull/55#issuecomment-6203485501).
  Callers cannot choose another validator revision. No live PR scripts,
  dependencies, or artifacts are executed.
- The job has only contents, pull-request, and issue read permissions, no
  repository secrets, and no persisted checkout credentials. The gate always
  uses `trigger_mode=skip`; native review requests remain human-authored.
- The guard requires open, ready, same-repository PR #55 targeting `main`, the
  `codex/native-review-receipts` source branch, Codex policy, and event head SHA
  equal to the live PR head. It rejects other PRs and becomes unusable after #55
  closes. Other PRs and manual dispatches still use default-branch scripts.
- Request a fresh native review after the final push. After it completes, rerun
  that head's existing `pull_request` gate if it has already failed waiting for
  evidence. The pinned validator checks genuine current-head
  evidence, all blocking threads, and HEAD again before success. A summary or
  reaction alone still cannot pass.

This is a real read-only validation run, not a manually published check or a
replacement review. Verify its logged validator SHA, token permissions, final
PR SHA, and native receipt. All required checks and resolved conversations still
apply, followed by the full 120-second readiness hold and protected merge.
Never disable protection or execute PR scripts with write privileges to repair
bootstrap. Future changes use the upgraded default-branch gate.

A manual dispatch on the head can validate the evidence successfully while the
PR's separate `pull_request` check suite remains red. It does not replace that
required run; do not delete failed checks or relax protection. The exception
therefore runs inside the original PR job, not a second check with the same name.

The marker author is configured by `aiReviewMarkerAuthorLogin` in
`.comet-control/config.json`. The default remains `github-actions[bot]`, but it
is not hard-coded as the only marker validator login. Until the marker-posting
workflow uses a configurable identity, the validator accepts both the configured
login and the current `GITHUB_TOKEN` author, `github-actions[bot]`.

A complementary `pnpm run review:retrigger` (not yet implemented) would skip step 1 for the "just rerun the current agent" case.

## Tier 2 and Tier 3 (design, not adopted)

A local post-push git hook (Tier 2) and a GitHub Actions workflow posting trigger comments via a fine-grained PAT (Tier 3) would provide broader automation coverage but introduce setup or secret-management cost. Record the full design in `docs_comet/adr/` when the recurring friction from Tier 1 outweighs the PAT security posture review.
