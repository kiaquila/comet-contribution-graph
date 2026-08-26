# Tasks: npm minor and patch maintenance

- [x] T001 Take the grouped update on current `main`.
- [x] T002 Add feature memory and durable maintenance evidence.
- [x] T003 Rebuild the Action distribution and run preflight.
- [ ] T004 Publish, request final-head Codex review, and clear all gates.

## Decision

- Commit the regenerated bundle in the same change as the bundler upgrade so
  the distribution check stays reproducible from the tracked source.
