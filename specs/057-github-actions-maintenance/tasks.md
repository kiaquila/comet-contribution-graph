# Tasks: GitHub Actions maintenance

## Setup

- [x] Confirm PR #68 base, head, branch, and dependency-only diff.
- [x] Confirm the official v6.1.1 and v1.0.269 tags resolve to Dependabot's
      proposed SHAs.

## Implementation

- [x] Preserve the four immutable action reference updates without
      workflow-policy changes.
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

### Decisions

- Keep the workflow update limited to the four immutable action repins.
- Preserve the dormant Claude review workflow without enabling its backend.

### Known Issues

- Claude review remains non-operational by repository policy; this update does
  not enable or validate that backend.
