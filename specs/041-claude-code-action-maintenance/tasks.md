# Tasks: Claude Code Action 1.0.236 maintenance

## Setup

- [x] Confirm PR #51 base, head, branch, and dependency-only diff.
- [x] Confirm both workflows use Dependabot's immutable v1.0.236 commit SHA.

## Implementation

- [x] Preserve the two action reference updates without policy changes.
- [x] Add complete feature memory for the maintenance update.
- [x] Update the durable dependency-maintenance record.
- [x] Raise `source-map-js` to 1.2.2 through the existing override mechanism.
- [x] Exempt only `source-map-js@1.2.2` from the release-age window so the
      security fix can install immediately.

## Verification

- [x] Run `pnpm run preflight` on the final local head (142 tests passed).
- [ ] Publish the final head and confirm all required GitHub checks are green.
- [ ] Request final-head Codex review and resolve every review thread.
- [ ] Observe the two-minute merge-ready hold and merge PR #51.

## Decisions

- Keep the update dependency-only and retain immutable SHA pinning.
- Do not enable or otherwise modify the dormant Claude review backend.
- Clear the newly published advisory with a narrow override rather than
  weakening the OSV gate.
- Retain the seven-day global cooldown and exempt only the patched package
  version, following pnpm's documented security-fix mechanism.
