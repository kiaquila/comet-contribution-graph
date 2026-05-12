# 012 — unicorn-hub parity

## Goal

Adopt the useful portable workflow pieces from
`https://github.com/kiaquila/unicorn-hub` without turning this product
repository into a blueprint repository.

## Scope

In scope:

- Fix the current OSV failure on `main`.
- Refresh stale repository memory in `AGENTS.md` and `CLAUDE.md`.
- Add config-driven repository control-plane helpers.
- Add local preflight and feature-memory templates.
- Add SENAR-style verification fields and PR checklist.
- Port the event-driven AI Review gate from Unicorn Hub while preserving this
  repository's `codex`/`gemini` review backend policy.
- Add branch-protection tooling and docs.
- Document which Unicorn Hub blueprint internals are intentionally not copied.

Out of scope:

- Replacing this repository's product-specific docs with generic
  `docs_project/` templates.
- Copying Unicorn Hub `profiles/`, `templates/`, bootstrap, or sanitizer flows
  as active product tooling.
- Restoring Claude review as a supported backend.
- Changing renderer behavior or the published GitHub Action SVG contract.

## Acceptance Criteria

1. Given the current dependency graph, when OSV scans the lockfile, then the
   known `fast-uri@3.1.0` findings are no longer present.
2. Given an agent starts from repository memory, when it reads `AGENTS.md` and
   `CLAUDE.md`, then those files describe the current TypeScript renderer,
   bundled Action, tests, and preview workflow rather than a prototype-only
   state.
3. Given local or CI gates need path policy, when scripts run, then shared
   configuration comes from `.unicorn-hub/config.json` with comet-specific
   paths and review agents.
4. Given a contributor prepares a product PR, when they use the installed
   templates and PR body, then goal, scope, acceptance evidence, negative
   scenarios, and process memory are visible before merge.
5. Given `AI_REVIEW_AGENT=codex`, when a PR lacks trusted current-head review
   evidence, then `AI Review` fails fast with a clear next action and can be
   rerun by trusted trigger/evidence events.
6. Given the repository owner is ready to enforce gates, when
   `scripts/apply-branch-protection.mjs` runs, then `main` can require
   `baseline-checks`, `guard`, `AI Review`, and `osv-scan` without hand-built
   API payloads.
7. Given future agents compare this repo to Unicorn Hub, when they read durable
   docs, then they can see which blueprint-only pieces remain intentionally out
   of scope.

## Negative Scenarios

1. Given a PR changes review scripts, when `AI Review` or `PR Guard` runs, then
   gate scripts still come from the trusted default branch rather than PR-head
   code.
2. Given a user selects Claude as review backend, when switcher scripts validate
   the request, then they reject it until Claude review is restored.
3. Given this is a product repository, when baseline checks run, then they must
   not require Unicorn Hub blueprint-only paths such as `templates/` or
   `profiles/`.

## Requirements

- FR-001: Keep one feature folder for the full Unicorn Hub parity PR.
- FR-002: Keep each numbered plan phase in a separate git commit.
- FR-003: Preserve the existing GitHub Action runtime contract and bundled
  `dist-action/` validation.
- FR-004: Keep docs under `docs_comet/` as the durable docs root.
- FR-005: Preserve `codex` as the default review backend and `gemini` as the
  only supported alternate review backend.

## Success Criteria

- SC-001: `pnpm run ci` passes locally.
- SC-002: `pnpm run preflight` exists and passes locally.
- SC-003: The PR is ready for review and has a trusted `@codex review` trigger
  comment.

## Assumptions

- The source of truth for Unicorn Hub behavior is the cloned/current
  `kiaquila/unicorn-hub` repository and its merged event-driven AI Review PR.
- Branch protection is applied after this PR lands, not from inside this PR.
