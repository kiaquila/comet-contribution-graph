# Tasks: @actions/exec v3

- [x] T001 Rebase the update on current `main`.
- [x] T002 Add feature memory and durable maintenance evidence.
- [x] T003 Install `@actions/exec` v3, regenerate the Action distribution, and
      run preflight.
- [ ] T004 Publish, request final-head Codex review, and clear all gates.

## Decision

- Keep the dependency update limited to the Action execution library and its
  transitive `@actions/io` v3 dependency.
