# Review Contract

> Audience: all agents. **Canonical source** for: per-backend review output format, severity rules, `AI_REVIEW_OUTCOME` schema. Prereq: `ai-orchestration-protocol.md` (agent routing). Sibling: `review-trigger-automation.md` (trigger mechanics).

## Backend Trigger Constraints (summary)

All three backends reject bot-posted trigger comments. A human-authored trigger is required:

- on **every new push** (`pull_request: synchronize`) for any backend, and
- on **PR open** for `codex` and `claude` — only Gemini Code Assist auto-reviews on `opened` / `ready_for_review`. With `AI_REVIEW_AGENT=codex` (current default), the initial `AI Review` run fails fast unless a trusted current-head marker or evidence exists.

Full backend matrix and mitigation Tiers: see `review-trigger-automation.md`. Canonical recovery: `pnpm run review:switch -- --to <agent>`.

## Codex Review (current default)

- Current default review backend, used when `AI_REVIEW_AGENT=codex`
- Native GitHub PR review surface from `chatgpt-codex-connector[bot]`
- Inline findings must carry `P0` to `P3`
- `P3`-only findings are advisory
- `P0` to `P2` findings block merge
- In `trigger_mode=skip`, formal reviews with `commit_id === headSha`
  stay authoritative.
- Summary-only / setup-error comments are accepted only when they land
  after a trusted current-head review-request marker. If the summary does not
  name the head SHA directly, the gate rejects it when a commit or force-push
  event occurred between the source trigger and summary.
- If evidence is absent, `AI Review` fails fast and is rerun by trusted trigger
  or trusted review-evidence events.

## Gemini Review

- Alternative review backend, used when `AI_REVIEW_AGENT=gemini`
- Native GitHub PR review surface from `gemini-code-assist[bot]`
- Inline findings are expected to carry `Critical`, `High`, `Medium`, or `Low`
- `Low`-only findings are advisory
- `Critical`, `High`, and `Medium` findings block merge

## Claude Review (currently non-operational)

Retained for schema reference only. The `claude-review.yml` workflow is dead
code pending cleanup; `ANTHROPIC_API_KEY` is not configured and the local
runner was rolled back. Do not select `AI_REVIEW_AGENT=claude` until restored.

Schema (when operational):

- Triggered by a human posting `@claude review once` on the PR
- Final result is a top-level comment, not a formal GitHub review state
- The comment must start with:

```text
AI_REVIEW_AGENT: claude
AI_REVIEW_SHA: <head sha>
AI_REVIEW_OUTCOME: pass|advisory|block
```

- `pass` and `advisory` are non-blocking
- `block` is merge-blocking

## Repository Focus

For `comet-contribution-graph`, reviewers should prioritize:

- contribution data correctness (date alignment, week/day indexing, top-N selection logic)
- animation and SVG output performance (frame budget, reflow, paint)
- `prefers-reduced-motion` compliance (static fallback must render correctly)
- accessibility (aria labels on grid cells, no motion without user consent)
- bundle size for Action embed (dependencies in the Node rendering path must stay lean)
- CDN supply-chain risks (Space Mono, any future script CDN dependencies)
- build and deploy safety

## SENAR Review Lens

Reviewers should check the implementation against the active feature memory.
Acceptance criteria, negative scenarios, and process-memory notes are part of
the review contract; an AI summary without evidence does not satisfy the done
gate.
