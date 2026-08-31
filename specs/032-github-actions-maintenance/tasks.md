# Tasks: GitHub Actions maintenance

- [x] T001 Take the grouped Dependabot action updates on the current `main`
      base.
- [x] T002 Confirm the updated actions remain pinned to immutable commit SHAs.
- [x] T003 Add complete feature memory and durable maintenance evidence.
- [x] T004 Run `pnpm run preflight` on the final head (115 tests passed).
- [ ] T005 Publish, request final-head Codex review, and clear all gates.

## Decision

- Preserve the existing workflow contracts: this update changes upstream action
  releases only, not repository review routing, permissions, or scanner input.

## Negative scenario

- Any workflow reference changed from a full release SHA to a mutable tag, or
  any accidental activation of Claude review, must fail review rather than be
  accepted as dependency maintenance.
