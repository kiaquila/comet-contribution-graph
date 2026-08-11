# 020 — tasks

- [x] T001 Rebase and inspect the grouped dependency diff.
- [x] T002 Add feature memory and durable maintenance evidence.
- [ ] T003 Install, rebuild, and run preflight.
- [ ] T004 Publish, request final-head Codex review, and clear all gates.

## Decision

- Commit regenerated `dist-action/` only when the upgraded NCC produces a
  different checked-in artifact.
