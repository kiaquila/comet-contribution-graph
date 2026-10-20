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

### Gate execution after the receipt-parser rollout

Every `AI Review` run checks out the repository default branch. There is no
PR-specific validator pin or selectable gate revision. The job has only
contents, pull-request, and issue read permissions, no repository secrets, and
no persisted checkout credentials. Native review requests remain human-authored
and the gate uses `trigger_mode=skip`.

For a new head, request native review with the full SHA. Trusted receipt and
edited-summary events wake the existing PR-event gate; the completion observer
recovers evidence that arrived during an active attempt. The gate validates the
actual receipt or formal review, unresolved findings, and the live head before
success. A summary or reaction alone cannot pass.

Verify the real PR job's checkout ref and commit, read-only token permissions,
reviewed head, and accepted native evidence. Keep every required check and
conversation gate, then hold the unchanged ready head for the full 120 seconds
before protected merge. A separate manual dispatch can pass while the PR's own
check suite remains red; it does not replace the original required PR run.

[PR #55's completion record](https://github.com/kiaquila/comet-contribution-graph/pull/55#issuecomment-6291246263)
preserves the history of the one-time read-only bootstrap. Its temporary pin and
guard have been removed now that the receipt-aware validator is on `main`.

The marker author is configured by `aiReviewMarkerAuthorLogin` in
`.comet-control/config.json`. The default remains `github-actions[bot]`, but it
is not hard-coded as the only marker validator login. Until the marker-posting
workflow uses a configurable identity, the validator accepts both the configured
login and the current `GITHUB_TOKEN` author, `github-actions[bot]`.

A complementary `pnpm run review:retrigger` (not yet implemented) would skip step 1 for the "just rerun the current agent" case.

## Tier 2 and Tier 3 (design, not adopted)

A local post-push git hook (Tier 2) and a GitHub Actions workflow posting trigger comments via a fine-grained PAT (Tier 3) would provide broader automation coverage but introduce setup or secret-management cost. Record the full design in `docs_comet/adr/` when the recurring friction from Tier 1 outweighs the PAT security posture review.
