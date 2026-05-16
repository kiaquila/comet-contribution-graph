# 013 — review gate follow-ups

## Goal

Resolve the non-blocking follow-up issues recorded after the Unicorn Hub parity
PR so the repository control plane is comet-specific, configurable, and less
likely to misclassify review evidence.

## Scope

In scope:

- Rename the local policy directory from the upstream-coupled name to a
  comet-specific name.
- Keep AI review request marker validation compatible with existing legacy
  marker comments while emitting the new marker name.
- Make AI review marker authors configurable through local policy.
- Tighten Codex and Gemini severity detection.
- Add an explicit warning when the branch-protection helper defaults required
  approving reviews to zero.
- Update tests and durable docs for the changed control-plane contract.

Out of scope:

- Changing supported review backends.
- Applying branch protection from this PR.
- Reworking the broader AI Review workflow architecture.

## Acceptance Criteria

1. Given repository helpers need local policy, when they read config, then they
   use `.comet-control/config.json`.
2. Given a legacy AI review request marker already exists, when the gate parses
   comments, then `unicorn-hub:ai-review-request` still parses, while new
   markers are emitted as `comet:ai-review-request`.
3. Given a repository config sets `aiReviewMarkerAuthorLogin`, when marker
   comments are validated, then that login is trusted without dropping the
   current workflow marker author `github-actions[bot]`.
4. Given Codex evidence contains lowercase `p0`, `p1`, or `p2`, when severity
   is checked, then it is treated as blocking.
5. Given Gemini text says `high confidence`, when severity is checked, then it
   is not treated as a `High` finding unless it is an explicit severity marker.
   If a Gemini review body or inline comment contains both advisory and
   blocking explicit severity markers, any blocking marker wins. Markdown
   emphasis around explicit severity labels or values, such as
   `**Severity:** High` or `Severity: **Medium**`, must still count as explicit.
6. Given `pnpm run branch:protect` is run without `--approvals`, when the helper
   builds the protection payload, then it warns before using `0`.

## Negative Scenarios

- Legacy marker parsing must not allow arbitrary non-marker comments to count as
  review requests.
- Customizing `aiReviewMarkerAuthorLogin` must not reject markers emitted by
  the existing `GITHUB_TOKEN` workflow path.
- Gemini inline comments without an explicit recognized severity should still
  block, preserving the existing conservative review gate behavior.
- Gemini review text with `Severity: Low` followed by `High:` or another
  blocking explicit marker must not pass as advisory-only.
- Gemini review text with Markdown-emphasized explicit severity must not pass
  as no-severity prose.
- The PR must not include unrelated files from the user's main checkout.

## Success Criteria

- `node --check` passes for changed scripts.
- `node --test tests/helpers.test.mjs` passes.
- `pnpm run preflight` passes locally before pushing.
