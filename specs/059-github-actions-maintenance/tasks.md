# Tasks: GitHub Actions maintenance

## Setup

- [x] Confirm PR #70 base, head, branch, and dependency-only diff.
- [x] Confirm the official v1.0.276 and v2.7.1 tags resolve to Dependabot's
      proposed SHAs.
- [x] Review the upstream v1.0.273 breaking-change notes that apply to the
      repository's comment-driven Claude workflows.

## Implementation

- [x] Preserve the three immutable action reference updates.
- [x] Add `--permission-mode acceptEdits` to both Claude workflows so their
      existing `--allowedTools` lists remain strict.
- [x] Add complete feature memory for the maintenance update.
- [x] Update the durable dependency-maintenance record.

## Verification

- [x] Run `pnpm run preflight` on the final local implementation (180 tests
      passed).
- [ ] Publish the final head and request current-head Codex review once.
- [ ] Confirm the required GitHub checks and review threads are clear.
- [ ] Observe the two-minute merge-ready hold and confirm the PR is merged.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because the control-plane change
  lacked a complete feature-memory triad.
- Accepting the version-only diff would adopt Claude Code Action's new auto
  mode, which no longer treats `--allowedTools` as a strict list.

### Decisions

- Keep the workflow update limited to the three immutable action repins and
  the upstream-recommended permission-mode compatibility flags.
- Preserve the dormant Claude review workflow without enabling its backend.

### Known Issues

- Claude review remains non-operational by repository policy; this update does
  not enable or validate that backend.
