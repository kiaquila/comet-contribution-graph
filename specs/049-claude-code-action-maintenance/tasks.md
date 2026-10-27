# Tasks: Claude Code Action 1.0.254 maintenance

## Setup

- [x] Confirm PR #60 base, head, branch, and dependency-only diff.
- [x] Confirm the official v1.0.254 tag resolves to Dependabot's proposed SHA.

## Implementation

- [x] Preserve the two action reference updates without workflow-policy changes.
- [x] Add complete feature memory for the maintenance update.
- [x] Update the durable dependency-maintenance record.
- [x] Raise the vulnerable `fast-uri` and `undici` transitive floors without
      weakening OSV scanning or repository security policy.

## Verification

- [x] Run `pnpm run preflight` on the final local implementation (157 tests
      passed).
- [ ] Publish the final head and request current-head Codex review once.
- [ ] Confirm the required GitHub checks and review threads are clear.

## Process Memory

### Dead Ends

- The original Dependabot head failed `guard` because the control-plane change
  lacked a complete feature-memory triad.
- The original head's OSV scan found fixable advisories in `fast-uri` 3.1.8 and
  `undici` 6.28.1.

### Decisions

- Keep the workflow update limited to the immutable action repin.
- Clear the two advisories through the existing override mechanism rather than
  weakening the OSV gate or changing security policy.

### Known Issues

- Claude review remains non-operational by repository policy; this update does
  not enable or validate that backend.
