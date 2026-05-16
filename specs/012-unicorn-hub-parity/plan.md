# 012 — plan

## Approach

Port Unicorn Hub in layers. Keep product-specific paths and review policy in
this repository, and copy only workflow primitives that remove current
operational friction.

## Commit Plan

| Plan item | Commit scope                                                                              | Verification                                              |
| --------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1         | Fix OSV and refresh stale repository memory.                                              | `pnpm why fast-uri`; `pnpm run check:repo`                |
| 2         | Add `.comet-control/config.json`, shared helpers, config-aware baseline, and `preflight`. | `pnpm run preflight`                                      |
| 3         | Add SENAR feature templates, `specs/README.md`, PR template, and docs.                    | `pnpm run format:check`                                   |
| 4         | Port event-driven AI Review marker/rerun workflow.                                        | `node --test tests/rerun.test.mjs tests/helpers.test.mjs` |
| 5         | Add branch-protection helper and docs.                                                    | `node --check scripts/apply-branch-protection.mjs`        |
| 6         | Document intentionally skipped Unicorn Hub pieces.                                        | `pnpm run format:check`                                   |

## Technical Context

- runtime: Node 24+ for repository tooling and GitHub Action code
- package manager: `pnpm@10.33.0`
- docs root: `docs_comet/`
- feature memory root: `specs/`
- review backends: `codex` and `gemini`
- intentionally unsupported review backend: `claude`

## Constitution Check

- Spec-first: this folder covers all product and orchestration changes in the
  PR.
- Testable boundaries: scripts expose pure helpers where feasible and are
  covered by local `node --test` tests.
- PR-only: work happens on `codex/unicorn-hub-parity`.
- Simplicity: generic Unicorn Hub bootstrap/template machinery is not copied
  unless the product repo has an active use for it.
- Deployability: renderer, Action build, static build, and `dist-action`
  checks remain in `pnpm run ci`.

## Verification

| Acceptance criterion | Evidence                                                |
| -------------------- | ------------------------------------------------------- |
| AC-001               | `pnpm why fast-uri`; OSV lockfile scan on PR            |
| AC-002               | `AGENTS.md` and `CLAUDE.md` diff                        |
| AC-003               | `pnpm run check:repo`; `pnpm run preflight`             |
| AC-004               | PR template, `.specify/templates/`, `specs/README.md`   |
| AC-005               | AI Review scripts/tests and workflow diff               |
| AC-006               | `scripts/apply-branch-protection.mjs` syntax check      |
| AC-007               | Durable docs list copied and skipped Unicorn Hub pieces |

Negative scenario evidence:

- Claude review remains rejected by `scripts/set-implementation-agent.mjs` and
  `scripts/switch-review-agent.mjs`.
- Blueprint-only paths stay out of product baseline requirements.

## Risks

- Risk: porting event-driven review could regress current Codex/Gemini flow.
  Mitigation: keep backend policy narrow and add focused helper/rerun tests.
- Risk: config-driven helpers may overgeneralize a small repository.
  Mitigation: use one small shared helper module and keep product checks
  explicit.
