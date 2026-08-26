# Tasks: @actions/core v3

- [x] T001 Take the update on current `main`.
- [x] T002 Add feature memory and durable maintenance evidence.
- [x] T003 Install @actions/core v3, rebuild the Action bundle, and run
      preflight.
- [ ] T004 Publish, request final-head Codex review, and clear all gates.

## Decision

- Keep the Action contract fixed; the upgrade only replaces the toolkit
  implementation behind the existing entrypoint.

## Type-resolution note

- `@actions/core` v1 reached `@actions/http-client` v2, whose declarations
  carried `/// <reference types="node" />`. That directive, not the repository
  configuration, was loading the Node global declarations. `@actions/core` v3
  reaches `@actions/http-client` v4, which drops the directive, so
  `tsconfig.json` now declares `"types": ["node"]` and states the dependency
  the sources always had.
