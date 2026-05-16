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
2. posts the correct native trigger comment (`@codex review` or `/gemini review`) using the local `gh` CLI auth — human-authored, therefore trusted
3. records a trusted current-head review-request marker through `AI Command Policy`
4. reruns the most recent failed `AI Review` job on the current PR head

When the selected backend posts trusted review evidence, `AI Review Rerun`
reruns the required `AI Review` check again so it can validate the evidence
without a long polling window.

The marker author is configured by `aiReviewMarkerAuthorLogin` in
`.comet-control/config.json`. The default remains `github-actions[bot]`, but it
is not hard-coded as the only marker validator login. Until the marker-posting
workflow uses a configurable identity, the validator accepts both the configured
login and the current `GITHUB_TOKEN` author, `github-actions[bot]`.

A complementary `pnpm run review:retrigger` (not yet implemented) would skip step 1 for the "just rerun the current agent" case.

## Tier 2 and Tier 3 (design, not adopted)

A local post-push git hook (Tier 2) and a GitHub Actions workflow posting trigger comments via a fine-grained PAT (Tier 3) would provide broader automation coverage but introduce setup or secret-management cost. Record the full design in `docs_comet/adr/` when the recurring friction from Tier 1 outweighs the PAT security posture review.
