# Tasks: TypeScript v7

- [x] T001 Rebase the update on current `main`.
- [x] T002 Add feature memory and durable maintenance evidence.
- [x] T003 Install TypeScript v7, adapt the Action bundle step for the NCC
  TypeScript-7 incompatibility, and run preflight.
- [ ] T004 Publish, request final-head Codex review, and clear all gates.

## Decision

- Retain compiler options; run NCC on JavaScript emitted by TypeScript v7
  because NCC v0.44.1 cannot load the TypeScript 7 API directly.
