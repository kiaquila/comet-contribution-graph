# 015 — tasks

## Implementation

- [x] T001 Inspect the Dependabot workflow-update diff and the failing guard.
- [x] T002 Add feature memory for the workflow updates.
- [x] T003 Record the durable dependency-maintenance workflow.
- [x] T004 Run preflight and publish the final head.

## Verification

- [ ] T005 Request `@codex review` from a trusted human account for the final
      head.
- [ ] T006 Confirm green required checks, Vercel preview, and no unresolved
      P0–P2 findings.

## Decisions

- Keep this change limited to the two Dependabot-proposed GitHub Action updates
  and their process evidence.
- Treat the existing guard failure as required delivery work, not as a reason
  to bypass the gate.
