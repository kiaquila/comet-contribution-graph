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
- No-findings comments support the legacy `Codex Review:` prefix and the native
  `<!-- codex-review-receipt:v1 -->` prefix. Receipts require exactly one
  `**Reviewed commit:**` field matching the current full head or its native
  ten-character abbreviation, plus an explicit no-major-issues verdict.
  Unknown/duplicate markers, conflicting commit fields, negative/incomplete
  results, and blocking severities cannot pass.
- Comment evidence requires a trusted current-head request marker and must be
  newer than its source trigger. Legacy comments without a SHA retain the
  timestamp/timeline boundary: intervening commits or force-pushes reject them.
- Formal reviews require an exact `commit_id`. They remain evidence even if a
  newer request marker is posted. The newest result wins, with failure taking
  precedence on timestamp ties. Unresolved blocking or untagged Codex threads
  on any head block success; P3-only threads retain advisory severity.
- `<!-- codex-pull-request-review-summary -->` comments, including the embedded
  `codex-review-state:v1` JSON, only wake evaluation. No schema or status in
  those summaries is accepted as a verdict. A summary, `Completed`, or a reaction
  alone never satisfies `AI Review`.
- The gate verifies live HEAD after reading evidence and rejects stale runs.
- If evidence is absent, `AI Review` fails fast and is rerun by trusted trigger
  or trusted review-evidence events.

## Gemini Review

- Alternative review backend, used when `AI_REVIEW_AGENT=gemini`
- Native GitHub PR review surface from `gemini-code-assist[bot]`
- Inline findings are expected to carry `Critical`, `High`, `Medium`, or `Low`
- `Low`-only findings are advisory
- `Critical`, `High`, and `Medium` findings block merge
- Severity words must be explicit review severities, for example
  `Severity: High`, `**Severity:** High`, `Severity: **High**`, `[High]`,
  `High severity`, or a line that starts with `High:`. Incidental phrases such
  as `high confidence` are not severity markers. When one review body or inline
  comment contains multiple explicit severity markers, any `Critical`, `High`,
  or `Medium` marker blocks the gate.

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
