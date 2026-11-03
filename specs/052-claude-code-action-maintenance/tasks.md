# Tasks: Claude Code Action 1.0.263 maintenance

## Setup

- [x] Confirm PR #63 base, head, branch, and dependency-only diff.
- [x] Confirm the official v1.0.263 tag resolves to Dependabot's proposed SHA.

## Implementation

- [x] Preserve the two action reference updates without workflow-policy changes.
- [x] Add complete feature memory for the maintenance update.
- [x] Update the durable dependency-maintenance record.
- [x] Raise vulnerable `minimatch` to 11.0.1 without weakening OSV scanning or
      the repository-wide release-age policy.

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
- The original head's OSV scan found `minimatch` 10.2.6 affected by
  `GHSA-g3hv-75wg-m249`.

### Decisions

- Keep the workflow update limited to the immutable action repin.
- Clear the advisory through the existing override mechanism and exempt only
  the fixed version from the release-age delay instead of weakening either
  security policy.

### Known Issues

- Claude review remains non-operational by repository policy; this update does
  not enable or validate that backend.
